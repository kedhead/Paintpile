import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { checkQuota, trackUsage, OPERATION_COSTS } from '@/lib/ai/usage-tracker';
import { getUserProfile } from '@/lib/firestore/users';
import { getAdminStorage } from '@/lib/firebase/admin';

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

    // Enhance image using Replicate
    const replicateClient = getReplicateClient();
    const result = await replicateClient.enhanceImage(sourceUrl);

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

    // Upload to Firebase Storage using Admin SDK
    const storage = getAdminStorage();
    const bucket = storage.bucket();
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
