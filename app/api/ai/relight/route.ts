import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { getUserProfile } from '@/lib/firestore/users';
import { getAdminStorage } from '@/lib/firebase/admin';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_DIRECTIONS: Record<string, string> = {
  none: 'None',
  left: 'Left Light',
  right: 'Right Light',
  top: 'Top Light',
  bottom: 'Bottom Light',
};

interface RelightRequest {
  userId: string;
  sourceUrl: string;
  direction: string; // 'none' | 'left' | 'right' | 'top' | 'bottom'
  prompt?: string;
}

/**
 * POST /api/ai/relight
 *
 * Generates a relit version of an image for a single light direction using IC-Light.
 * Called once per direction — the client caches results and lets users pick directions.
 *
 * No credits/quota — free tool for all authenticated users.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let tempInputPath: string | null = null;

  try {
    const body: RelightRequest = await request.json();
    const { userId, sourceUrl, direction, prompt } = body;

    if (!userId || !sourceUrl || !direction) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, sourceUrl, direction' },
        { status: 400 }
      );
    }

    const lightLabel = VALID_DIRECTIONS[direction];
    if (!lightLabel) {
      return NextResponse.json(
        { success: false, error: `Invalid direction: ${direction}. Must be one of: ${Object.keys(VALID_DIRECTIONS).join(', ')}` },
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
    console.log(`[Relight] Downloading source image for direction: ${lightLabel}...`);
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

    // Run IC-Light for this single direction
    console.log(`[Relight] Running IC-Light for direction: ${lightLabel}...`);
    const replicateClient = getReplicateClient();
    const result = await replicateClient.relightImage(tempUrl, lightLabel, prompt);

    // Get image buffer
    let imageBuffer: Buffer;
    if (result.imageBuffer) {
      imageBuffer = result.imageBuffer;
    } else if (result.outputUrl) {
      imageBuffer = await replicateClient.downloadImage(result.outputUrl);
    } else {
      throw new Error(`No image data returned for direction: ${lightLabel}`);
    }

    // Upload result to Firebase
    const outputPath = `users/${userId}/temp/relight_${direction}_${timestamp}.png`;
    const outputFile = bucket.file(outputPath);
    await outputFile.save(imageBuffer, {
      contentType: 'image/png',
      metadata: { contentType: 'image/png' },
    });
    await outputFile.makePublic();
    const outputUrl = `https://storage.googleapis.com/${bucket.name}/${outputPath}`;

    const processingTime = Date.now() - startTime;
    console.log(`[Relight] Direction ${lightLabel} complete in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        direction,
        imageUrl: outputUrl,
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
