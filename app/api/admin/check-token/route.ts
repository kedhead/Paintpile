/**
 * GET /api/admin/check-token
 *
 * Debug endpoint to check current user's token and custom claims
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();
    if (!auth.isAdmin) return forbiddenResponse();

    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader!.substring(7);

    // Decode the token to see claims (base64 decode for debug display)
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return NextResponse.json({
      success: true,
      claims: payload,
      hasAdminClaim: payload.admin === true,
      userId: payload.sub || payload.user_id,
      email: payload.email,
    });
  } catch (error: any) {
    console.error('[Check Token] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to check token'
      },
      { status: 500 }
    );
  }
}
