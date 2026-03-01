import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { getUserProfile } from '@/lib/firestore/users';
import { getAdminStorage } from '@/lib/firebase/admin';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DepthEstimateRequest {
  userId: string;
  sourceUrl: string;
}

/**
 * POST /api/ai/depth-estimate
 *
 * Runs monocular depth estimation on an uploaded image, then computes
 * a normal map from the depth. Returns both as Firebase Storage URLs.
 * Used by the Lighting Reference tool for interactive lighting previews.
 *
 * No credits/quota — free tool for all authenticated users.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let tempInputPath: string | null = null;

  try {
    const body: DepthEstimateRequest = await request.json();
    const { userId, sourceUrl } = body;

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
    console.log('[DepthEstimate] Downloading source image...');
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok) {
      throw new Error(`Failed to download source image: ${sourceResponse.status}`);
    }
    const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());

    // Resize to max 1024px
    const maxDimension = 1024;
    const imageMetadata = await sharp(sourceBuffer).metadata();
    console.log(`[DepthEstimate] Source dimensions: ${imageMetadata.width}x${imageMetadata.height}`);

    let processedBuffer: Buffer<ArrayBuffer> = sourceBuffer;
    const maxCurrentDimension = Math.max(imageMetadata.width || 0, imageMetadata.height || 0);

    if (maxCurrentDimension > maxDimension) {
      console.log(`[DepthEstimate] Resizing to fit ${maxDimension}px max...`);
      processedBuffer = Buffer.from(await sharp(sourceBuffer)
        .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer());
    }

    const resizedMeta = await sharp(processedBuffer).metadata();
    const width = resizedMeta.width!;
    const height = resizedMeta.height!;
    console.log(`[DepthEstimate] Processing dimensions: ${width}x${height}`);

    // Upload resized image to temp storage for Replicate
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const timestamp = Date.now();
    tempInputPath = `users/${userId}/temp/depth_input_${timestamp}.png`;
    const tempFile = bucket.file(tempInputPath);

    await tempFile.save(processedBuffer, {
      contentType: 'image/png',
      metadata: { contentType: 'image/png' },
    });
    await tempFile.makePublic();
    const tempUrl = `https://storage.googleapis.com/${bucket.name}/${tempInputPath}`;

    // Run depth estimation via Replicate
    console.log('[DepthEstimate] Running Depth Anything V2...');
    const replicateClient = getReplicateClient();
    const result = await replicateClient.depthEstimate(tempUrl);

    // Get depth map buffer
    let depthBuffer: Buffer;
    if (result.imageBuffer) {
      depthBuffer = result.imageBuffer;
    } else if (result.outputUrl) {
      depthBuffer = await replicateClient.downloadImage(result.outputUrl);
    } else {
      throw new Error('No depth map data returned from Replicate');
    }

    // Ensure depth map matches our processing dimensions
    depthBuffer = await sharp(depthBuffer)
      .resize(width, height, { fit: 'fill' })
      .png()
      .toBuffer();

    // Apply slight blur to reduce noise before normal computation
    const blurredDepth = await sharp(depthBuffer)
      .blur(1.2)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const depthPixels = blurredDepth.data;
    const depthChannels = blurredDepth.info.channels;

    // Compute normal map from depth using Sobel-like central differences
    // Depth values are 0-255; we normalize to [0,1] so the strength param
    // directly controls how much surface tilt the normals capture.
    console.log('[DepthEstimate] Computing normal map...');
    const normalData = Buffer.alloc(width * height * 3);
    const strength = 10.0; // Higher = more surface detail in normals

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Get depth value normalized to [0, 1]
        const getDepth = (px: number, py: number): number => {
          const cx = Math.max(0, Math.min(width - 1, px));
          const cy = Math.max(0, Math.min(height - 1, py));
          return depthPixels[(cy * width + cx) * depthChannels] / 255.0;
        };

        // Central differences on normalized depth
        const dX = getDepth(x + 1, y) - getDepth(x - 1, y);
        const dY = getDepth(x, y + 1) - getDepth(x, y - 1);

        // Normal vector — strength amplifies subtle depth gradients
        const nx = -dX * strength;
        const ny = -dY * strength;
        const nz = 1.0;

        // Normalize
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const nnx = nx / len;
        const nny = ny / len;
        const nnz = nz / len;

        // Encode to RGB [0, 255]
        const outIdx = (y * width + x) * 3;
        normalData[outIdx] = Math.round((nnx + 1) * 0.5 * 255);
        normalData[outIdx + 1] = Math.round((nny + 1) * 0.5 * 255);
        normalData[outIdx + 2] = Math.round((nnz + 1) * 0.5 * 255);
      }
    }

    // Convert normal data to PNG
    const normalBuffer = await sharp(normalData, {
      raw: { width, height, channels: 3 },
    }).png().toBuffer();

    // Upload depth map and normal map to Firebase temp storage
    const depthPath = `users/${userId}/temp/depth_map_${timestamp}.png`;
    const normalPath = `users/${userId}/temp/normal_map_${timestamp}.png`;

    const depthFile = bucket.file(depthPath);
    const normalFile = bucket.file(normalPath);

    await Promise.all([
      depthFile.save(depthBuffer, { contentType: 'image/png', metadata: { contentType: 'image/png' } }),
      normalFile.save(normalBuffer, { contentType: 'image/png', metadata: { contentType: 'image/png' } }),
    ]);

    await Promise.all([
      depthFile.makePublic(),
      normalFile.makePublic(),
    ]);

    const depthMapUrl = `https://storage.googleapis.com/${bucket.name}/${depthPath}`;
    const normalMapUrl = `https://storage.googleapis.com/${bucket.name}/${normalPath}`;

    const processingTime = Date.now() - startTime;
    console.log(`[DepthEstimate] Complete in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        depthMapUrl,
        normalMapUrl,
        width,
        height,
        processingTime,
      },
    });
  } catch (error: any) {
    console.error('[DepthEstimate] Failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to estimate depth',
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
        console.warn('[DepthEstimate] Failed to clean up temp input:', err);
      }
    }
  }
}
