import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/ai/anthropic-client';
import { findMatchingPaints } from '@/lib/ai/color-matcher';
import { checkQuota, trackUsage, OPERATION_COSTS } from '@/lib/ai/usage-tracker';
import { getUserProfile } from '@/lib/firestore/users';
import { ColorSuggestion } from '@/types/photo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SuggestPaintsRequest {
  photoId: string;
  projectId: string;
  userId: string;
  imageUrl: string;
  context?: string;
}

/**
 * POST /api/ai/suggest-paints
 *
 * Analyze a miniature photo and suggest matching paints from the database.
 * Uses Claude 3.5 Haiku Vision API + Delta E color matching.
 *
 * Cost: ~8 credits ($0.008) per request
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: SuggestPaintsRequest = await request.json();
    const { userId, imageUrl, context } = body;

    // Validate required fields
    if (!userId || !imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, imageUrl',
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
    const estimatedCost = OPERATION_COSTS.paintSuggestions;
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

    // Validate image URL (must be from Firebase Storage)
    if (!imageUrl.startsWith('https://firebasestorage.googleapis.com/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid image URL. Must be a Firebase Storage URL.',
        },
        { status: 400 }
      );
    }

    // Analyze colors with Claude Vision API
    const anthropicClient = getAnthropicClient();
    const colorAnalysis = await anthropicClient.analyzePaintColors(imageUrl, context);

    // Match each detected color to paints in database
    const suggestions: ColorSuggestion[] = await Promise.all(
      colorAnalysis.colors.map(async (detectedColor) => {
        const matches = await findMatchingPaints(detectedColor.hex, 3);

        return {
          hexColor: detectedColor.hex,
          description: `${detectedColor.name} - ${detectedColor.notes}`,
          matchedPaints: matches.map(m => m.paint),
          confidence: colorAnalysis.confidence,
          location: detectedColor.location,
        };
      })
    );

    // Track actual usage
    const actualCost = estimatedCost;
    await trackUsage(userId, 'paintSuggestions', actualCost);

    const processingTime = Date.now() - startTime;

    // Return suggestions
    return NextResponse.json(
      {
        success: true,
        message: 'Paint suggestions generated successfully',
        data: {
          suggestions,
          colorsDetected: colorAnalysis.colors.length,
          confidence: colorAnalysis.confidence,
          creditsUsed: actualCost,
          processingTime,
          analysisText: colorAnalysis.analysisText,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[AI] Paint suggestions failed:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate paint suggestions',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
