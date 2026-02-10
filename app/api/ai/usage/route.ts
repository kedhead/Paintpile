/**
 * GET /api/ai/usage
 *
 * Fetch AI usage statistics for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserUsage } from '@/lib/ai/usage-tracker';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    // Use the authenticated user's ID — ignore any userId query param
    const stats = await getUserUsage(auth.uid);

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
