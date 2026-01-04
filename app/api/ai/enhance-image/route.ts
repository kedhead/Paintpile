import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { checkQuota, trackUsage, OPERATION_COSTS } from '@/lib/ai/usage-tracker';
import { getUserProfile } from '@/lib/firestore/users';
import { getAdminStorage } from '@/lib/firebase/admin';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface EnhanceImageRequest {
  photoId: string;
  projectId: string;
  userId: string;
  sourceUrl: string;
}

/**
 * POST /api/ai/enhance-image
 *
 * Enhance miniature photo with better clarity and detail (2x upscale).
 * Uses Real-ESRGAN for professional display-ready images.
 * Uploads the processed image to Firebase Storage.
 *
 * Cost: ~10 credits ($0.01) per request
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: EnhanceImageRequest = await request.json();
    const { photoId, projectId, userId, sourceUrl } = body;

    // Validate required fields
    if (!photoId || !projectId || !userId || !sourceUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: photoId, projectId, userId, sourceUrl',
        },
        { status: 400 }
      );
    }

    // Check if user has Pro subscription or AI enabled
    const user = await getUserProfile(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const hasPro = user.subscription?.tier === 'pro' && user.subscription?.status === 'active';
    const hasAIEnabled = user.features?.aiEnabled === true;

    if (!hasPro && !hasAIEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI features require Pro subscription',
          upgradeUrl: '/settings/subscription',
        },
        { status: 403 }
      );
    }

    // Check quota
    const estimatedCost = OPERATION_COSTS.enhancement;
    const quotaCheck = await checkQuota(userId, estimatedCost);

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.reason,
          stats: quotaCheck.stats,
        },
        { status: 429 }
      );
    }

    // Validate source URL
    if (!sourceUrl.startsWith('https://firebasestorage.googleapis.com/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid source URL. Must be a Firebase Storage URL.',
        },
        { status: 400 }
      );
    }

    // Download and resize image if needed (max 1024px to fit in GPU memory)
    console.log('[Enhance] Downloading source image...');
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok) {
      throw new Error(`Failed to download source image: ${sourceResponse.status}`);
    }

    const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());

    // Check dimensions and resize if needed
    const imageMetadata = await sharp(sourceBuffer).metadata();
    console.log(`[Enhance] Source dimensions: ${imageMetadata.width}x${imageMetadata.height}`);

    let processedBuffer: Buffer = sourceBuffer;
    const maxDimension = 1024; // Max size to fit in GPU memory

    if (imageMetadata.width && imageMetadata.height) {
      const maxCurrentDimension = Math.max(imageMetadata.width, imageMetadata.height);

      if (maxCurrentDimension > maxDimension) {
        console.log(`[Enhance] Resizing image to fit ${maxDimension}px max...`);
        const resizedBuffer = await sharp(sourceBuffer)
          .resize(maxDimension, maxDimension, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .toBuffer();

        processedBuffer = Buffer.from(resizedBuffer);

        const resizedMetadata = await sharp(processedBuffer).metadata();
        console.log(`[Enhance] Resized to: ${resizedMetadata.width}x${resizedMetadata.height}`);
      }
    }

    // Upload resized image temporarily for Replicate to process
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const tempPath = `users/${userId}/temp/${photoId}_temp.png`;
    const tempFile = bucket.file(tempPath);

    await tempFile.save(processedBuffer, {
      contentType: 'image/png',
      metadata: { contentType: 'image/png' },
    });
    await tempFile.makePublic();

    const tempUrl = `https://storage.googleapis.com/${bucket.name}/${tempPath}`;
    console.log(`[Enhance] Temp URL: ${tempUrl}`);

    // Enhance image using Replicate
    const replicateClient = getReplicateClient();
    const result = await replicateClient.enhanceImage(tempUrl);

    // Clean up temp file
    try {
      await tempFile.delete();
    } catch (error) {
      console.warn('[Enhance] Failed to delete temp file:', error);
    }

    // Get the processed image buffer
    let imageBuffer: Buffer;
    if (result.imageBuffer) {
      // Stream returned image data directly
      imageBuffer = result.imageBuffer;
    } else if (result.outputUrl) {
      // URL returned, need to download
      imageBuffer = await replicateClient.downloadImage(result.outputUrl);
    } else {
      throw new Error('No image data or URL returned from Replicate');
    }

    // Upload enhanced image to Firebase Storage
    const storagePath = `users/${userId}/projects/${projectId}/photos/${photoId}/ai/${photoId}_enhanced.png`;
    const file = bucket.file(storagePath);

    await file.save(imageBuffer, {
      contentType: 'image/png',
      metadata: {
        contentType: 'image/png',
      },
    });

    // Make the file publicly readable
    await file.makePublic();

    // Get download URL
    const processedUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Track usage
    const actualCost = estimatedCost;
    await trackUsage(userId, 'enhancement', actualCost);

    const totalProcessingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        message: 'Image enhanced successfully',
        data: {
          processedUrl,
          creditsUsed: actualCost,
          processingTime: result.processingTime,
          totalTime: totalProcessingTime,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[AI] Image enhancement failed:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to enhance image',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
