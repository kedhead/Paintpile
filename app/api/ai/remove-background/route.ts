import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { checkQuota, trackUsage, OPERATION_COSTS } from '@/lib/ai/usage-tracker';
import { getUser } from '@/lib/firestore/users';
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/firebase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RemoveBackgroundRequest {
  photoId: string;
  projectId: string;
  userId: string;
  sourceUrl: string;
}

/**
 * POST /api/ai/remove-background
 *
 * Remove background from a miniature photo using Replicate RMBG-1.4 model.
 * Uploads the processed image to Firebase Storage.
 *
 * Cost: ~2 credits ($0.002) per request
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: RemoveBackgroundRequest = await request.json();
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
    const user = await getUser(userId);
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
    const estimatedCost = OPERATION_COSTS.backgroundRemoval;
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

    // Remove background using Replicate
    const replicateClient = getReplicateClient();
    const result = await replicateClient.removeBackground(sourceUrl);

    // Download the processed image
    const imageBuffer = await replicateClient.downloadImage(result.outputUrl);

    // Upload to Firebase Storage in ai/ folder
    const storagePath = `users/${userId}/projects/${projectId}/photos/${photoId}/ai/${photoId}_bg_removed.png`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, imageBuffer, {
      contentType: 'image/png',
    });

    // Get download URL
    const processedUrl = await getDownloadURL(storageRef);

    // Track usage
    const actualCost = estimatedCost;
    await trackUsage(userId, 'backgroundRemoval', actualCost);

    const totalProcessingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        message: 'Background removed successfully',
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
    console.error('[AI] Background removal failed:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to remove background',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
