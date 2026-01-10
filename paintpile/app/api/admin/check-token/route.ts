/**
 * GET /api/admin/check-token
 *
 * Debug endpoint to check current user's token and custom claims
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No authorization header found',
        note: 'This endpoint needs to be called with Firebase Auth token'
      });
    }

    const token = authHeader.substring(7);

    // Decode the token to see claims (this is just base64 decode, not validation)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token format'
      });
    }

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
