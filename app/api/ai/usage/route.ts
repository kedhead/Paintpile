/**
 * GET /api/ai/usage
 *
 * Fetch AI usage statistics for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserUsage } from '@/lib/ai/usage-tracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        },
        { status: 400 }
      );
    }

    // Get usage statistics
    const stats = await getUserUsage(userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    console.error('[AI Usage API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch usage statistics',
      },
      { status: 500 }
    );
  }
}
