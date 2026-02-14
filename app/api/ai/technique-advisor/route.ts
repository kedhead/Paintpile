import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/ai/anthropic-client';
import { checkQuota, trackUsage, OPERATION_COSTS } from '@/lib/ai/usage-tracker';
import { trackAIUsage } from '@/lib/ai/tracking';
import { getUserProfile } from '@/lib/firestore/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TechniqueAdvisorRequest {
  userId: string;
  imageUrl: string;
  context?: string;
}

/**
 * POST /api/ai/technique-advisor
 *
 * Analyze a miniature photo and recommend painting techniques for improvement.
 * Uses Claude Vision API for technique assessment and recommendations.
 *
 * Cost: ~8 credits ($0.008) per request
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: TechniqueAdvisorRequest = await request.json();
    const { userId, imageUrl, context } = body;

    if (!userId || !imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, imageUrl',
        },
        { status: 400 }
      );
    }

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

    const estimatedCost = OPERATION_COSTS.techniqueAdvisor;
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

    if (!imageUrl.startsWith('https://firebasestorage.googleapis.com/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid image URL. Must be a Firebase Storage URL.',
        },
        { status: 400 }
      );
    }

    const anthropicClient = getAnthropicClient();
    const analysis = await anthropicClient.analyzeTechniques(imageUrl, context);

    const actualCost = estimatedCost;
    await trackUsage(userId, 'techniqueAdvisor', actualCost);
    await trackAIUsage(userId, 'technique_advisor');

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          techniques: analysis.techniques,
          overallAssessment: analysis.overallAssessment,
          confidence: analysis.confidence,
          creditsUsed: actualCost,
          processingTime,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[AI] Technique advisor failed:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze techniques',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
