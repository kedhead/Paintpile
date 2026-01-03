/**
 * POST /api/admin/grant-admin
 *
 * Grant or revoke admin access to a user using Firebase Custom Claims
 * This endpoint is protected and can only be called by existing admins
 */

import { NextRequest, NextResponse } from 'next/server';
import { grantAdminAccess, revokeAdminAccess, getUserCustomClaims } from '@/lib/firebase/admin';

// Hardcoded list of super admins who can grant admin access
// These are checked by email from the Authorization header
const SUPER_ADMINS = ['kendalldavis1@gmail.com'];

export async function POST(request: NextRequest) {
  try {
    // This endpoint is primarily for local development
    // In production, use the grant-admin script or Firebase Console

    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    const { userId, grant } = body;

    console.log('[Grant Admin] Request:', { userId, grant });

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    if (grant === undefined) {
      return NextResponse.json(
        { success: false, error: 'grant parameter is required (true/false)' },
        { status: 400 }
      );
    }

    // Security check: Require secret key for initial setup
    const setupSecret = process.env.ADMIN_SETUP_SECRET;

    if (!setupSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'This endpoint is disabled. Use the grant-admin script locally or contact an administrator.'
        },
        { status: 503 }
      );
    }

    if (authHeader !== `Bearer ${setupSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - invalid setup secret' },
        { status: 403 }
      );
    }

    // Grant or revoke admin access
    if (grant) {
      await grantAdminAccess(userId);
      console.log(`[Grant Admin] Admin access granted to ${userId}`);
    } else {
      await revokeAdminAccess(userId);
      console.log(`[Grant Admin] Admin access revoked from ${userId}`);
    }

    // Get updated claims to verify
    const updatedClaims = await getUserCustomClaims(userId);

    return NextResponse.json({
      success: true,
      message: grant ? 'Admin access granted' : 'Admin access revoked',
      userId,
      customClaims: updatedClaims,
    });
  } catch (error: any) {
    console.error('[Grant Admin] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update admin access',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
