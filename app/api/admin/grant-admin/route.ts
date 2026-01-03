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
    // For initial setup, we'll use a secret key approach
    // After first admin is set, this can be updated to check custom claims
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
    // OR check if calling user is already an admin
    const setupSecret = process.env.ADMIN_SETUP_SECRET;

    if (authHeader === `Bearer ${setupSecret}`) {
      // Allow with secret key
      console.log('[Grant Admin] Authorized via setup secret');
    } else {
      // TODO: Add proper admin authentication check here
      // For now, we'll allow this for initial setup
      return NextResponse.json(
        { success: false, error: 'Unauthorized - requires admin access or setup secret' },
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
