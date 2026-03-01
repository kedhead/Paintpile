import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { getUserProfile } from '@/lib/firestore/users';
import { getAdminStorage } from '@/lib/firebase/admin';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RelightRequest {
  userId: string;
  sourceUrl: string;
  prompt?: string;
}

const LIGHT_DIRECTIONS = [
  { key: 'none', label: 'None' },
  { key: 'left', label: 'Left Light' },
  { key: 'right', label: 'Right Light' },
  { key: 'top', label: 'Top Light' },
  { key: 'bottom', label: 'Bottom Light' },
] as const;

/**
 * POST /api/ai/relight
 *
 * Generates relit versions of an image from 5 light directions using IC-Light.
 * All 5 directions run in parallel on Replicate (~22s total).
 * Results are uploaded to Firebase Storage as temp files.
 *
 * No credits/quota — free tool for all authenticated users.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let tempInputPath: string | null = null;

  try {
    const body: RelightRequest = await request.json();
    const { userId, sourceUrl, prompt } = body;

    if (!userId || !sourceUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, sourceUrl' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await getUserProfile(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate source URL
    if (!sourceUrl.startsWith('https://firebasestorage.googleapis.com/') &&
        !sourceUrl.startsWith('https://storage.googleapis.com/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid source URL. Must be a Firebase Storage URL.' },
        { status: 400 }
      );
    }

    // Download source image
    console.log('[Relight] Downloading source image...');
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok) {
      throw new Error(`Failed to download source image: ${sourceResponse.status}`);
    }
    const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());

    // Resize to max 1024px for IC-Light
    const maxDimension = 1024;
    const imageMetadata = await sharp(sourceBuffer).metadata();
    console.log(`[Relight] Source dimensions: ${imageMetadata.width}x${imageMetadata.height}`);

    let processedBuffer: Buffer = sourceBuffer;
    const maxCurrentDimension = Math.max(imageMetadata.width || 0, imageMetadata.height || 0);

    if (maxCurrentDimension > maxDimension) {
      console.log(`[Relight] Resizing to fit ${maxDimension}px max...`);
      processedBuffer = Buffer.from(await sharp(sourceBuffer)
        .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer());
    }

    const resizedMeta = await sharp(processedBuffer).metadata();
    const width = resizedMeta.width!;
    const height = resizedMeta.height!;

    // Pick IC-Light dimensions: snap to nearest allowed value (multiples of 64, 256-1024)
    const allowedSizes = [256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024];
    const snapToAllowed = (v: number) => allowedSizes.reduce((prev, curr) =>
      Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
    );
    const icWidth = snapToAllowed(width);
    const icHeight = snapToAllowed(height);

    console.log(`[Relight] Processing dimensions: ${width}x${height}, IC-Light: ${icWidth}x${icHeight}`);

    // Upload resized image to temp storage for Replicate
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const timestamp = Date.now();
    tempInputPath = `users/${userId}/temp/relight_input_${timestamp}.png`;
    const tempFile = bucket.file(tempInputPath);

    await tempFile.save(processedBuffer, {
      contentType: 'image/png',
      metadata: { contentType: 'image/png' },
    });
    await tempFile.makePublic();
    const tempUrl = `https://storage.googleapis.com/${bucket.name}/${tempInputPath}`;

    // Run directions sequentially to avoid Replicate rate limits
    // (low-credit accounts: 6 req/min, burst of 1)
    console.log('[Relight] Running IC-Light for all 5 directions (sequential)...');
    const replicateClient = getReplicateClient();
    const relightResults: { key: string; url: string }[] = [];

    for (const { key, label } of LIGHT_DIRECTIONS) {
      console.log(`[Relight] Starting direction: ${label}`);
      const result = await replicateClient.relightImage(tempUrl, label, prompt);

      // Get image buffer
      let imageBuffer: Buffer;
      if (result.imageBuffer) {
        imageBuffer = result.imageBuffer;
      } else if (result.outputUrl) {
        imageBuffer = await replicateClient.downloadImage(result.outputUrl);
      } else {
        throw new Error(`No image data returned for direction: ${label}`);
      }

      // Upload to Firebase
      const outputPath = `users/${userId}/temp/relight_${key}_${timestamp}.png`;
      const outputFile = bucket.file(outputPath);
      await outputFile.save(imageBuffer, {
        contentType: 'image/png',
        metadata: { contentType: 'image/png' },
      });
      await outputFile.makePublic();
      const outputUrl = `https://storage.googleapis.com/${bucket.name}/${outputPath}`;

      console.log(`[Relight] Completed direction: ${label} (${result.processingTime}ms)`);
      relightResults.push({ key, url: outputUrl });
    }

    // Build images map
    const images: Record<string, string> = {};
    for (const { key, url } of relightResults) {
      images[key] = url;
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Relight] All directions complete in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        images,
        width,
        height,
        processingTime,
      },
    });
  } catch (error: any) {
    console.error('[Relight] Failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to relight image',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    // Clean up temp input file
    if (tempInputPath) {
      try {
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        await bucket.file(tempInputPath).delete();
      } catch (err) {
        console.warn('[Relight] Failed to clean up temp input:', err);
      }
    }
  }
}
