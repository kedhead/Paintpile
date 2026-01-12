import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/ai/anthropic-client';
import { findMatchingPaints } from '@/lib/ai/color-matcher';
import { checkQuota, trackUsage, OPERATION_COSTS } from '@/lib/ai/usage-tracker';
import { getUserProfile } from '@/lib/firestore/users';
import { GenerateRecipeRequest, GenerateRecipeResponse, GeneratedRecipe } from '@/types/ai-recipe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/generate-recipe
 *
 * Generate a complete paint recipe from a miniature photo using Claude 3.5 Sonnet.
 * Includes color detection, paint matching, and step-by-step instructions.
 *
 * Cost: ~25 credits ($0.025) per request
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: GenerateRecipeRequest = await request.json();
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
          error: 'AI recipe generation requires Pro subscription',
          upgradeUrl: '/settings/subscription',
        },
        { status: 403 }
      );
    }

    // Check quota
    const estimatedCost = OPERATION_COSTS.recipeGeneration;
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

    // Generate recipe with Claude Sonnet
    console.log('[AI Recipe] Generating recipe from photo:', imageUrl.substring(0, 100));
    const anthropicClient = getAnthropicClient();
    const generatedRecipe = await anthropicClient.generateRecipeFromPhoto(imageUrl, context);

    // Match paints for each detected color
    console.log('[AI Recipe] Matching paints for', generatedRecipe.ingredients.length, 'colors');
    const ingredientsWithMatches = await Promise.all(
      generatedRecipe.ingredients.map(async (ingredient) => {
        try {
          const matches = await findMatchingPaints(ingredient.hexColor, 3);
          return {
            ...ingredient,
            matchedPaints: matches.map(m => m.paint),
          };
        } catch (error) {
          console.error('[AI Recipe] Error matching paint for', ingredient.hexColor, error);
          return {
            ...ingredient,
            matchedPaints: [],
          };
        }
      })
    );

    const recipeWithMatches: GeneratedRecipe = {
      ...generatedRecipe,
      ingredients: ingredientsWithMatches,
    };

    // Track actual usage
    const actualCost = estimatedCost;
    await trackUsage(userId, 'recipeGeneration', actualCost);

    const processingTime = Date.now() - startTime;

    console.log('[AI Recipe] Recipe generated successfully:', recipeWithMatches.name);
    console.log('[AI Recipe] Confidence:', recipeWithMatches.confidence);
    console.log('[AI Recipe] Ingredients:', recipeWithMatches.ingredients.length);
    console.log('[AI Recipe] Steps:', recipeWithMatches.steps.length);
    console.log('[AI Recipe] Processing time:', processingTime, 'ms');

    // Return recipe
    const response: GenerateRecipeResponse = {
      success: true,
      data: {
        recipe: recipeWithMatches,
        creditsUsed: actualCost,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('[AI Recipe] Generation failed:', error);
    console.error('Error stack:', error.stack);

    const response: GenerateRecipeResponse = {
      success: false,
      error: error.message || 'Failed to generate recipe',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
