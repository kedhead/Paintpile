/**
 * POST /api/admin/update-user-access
 *
 * Update user's Pro subscription or AI feature access (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, aiEnabled, proTier } = body;

    console.log('[Admin Update] Request:', { userId, aiEnabled, proTier });

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log('[Admin Update] User not found:', userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userSnap.data() || {};
    console.log('[Admin Update] Current user data:', {
      hasFeatures: !!userData.features,
      hasSubscription: !!userData.subscription
    });

    const updates: any = {};

    // Update AI enabled flag
    if (aiEnabled !== undefined) {
      console.log('[Admin Update] Setting aiEnabled to:', aiEnabled);
      // Build complete features object to avoid nested update issues
      updates.features = {
        aiEnabled: aiEnabled,
      };
      // Preserve other features if they exist
      if (userData.features && typeof userData.features === 'object') {
        updates.features = { ...userData.features, aiEnabled };
      }
    }

    // Update Pro tier
    if (proTier !== undefined) {
      console.log('[Admin Update] Setting proTier to:', proTier);
      if (proTier) {
        // Grant Pro - build complete subscription object
        const now = Timestamp.now();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        updates.subscription = {
          tier: 'pro',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: Timestamp.fromDate(endDate),
        };
        // Preserve other subscription fields if they exist
        if (userData.subscription && typeof userData.subscription === 'object') {
          updates.subscription = { ...userData.subscription, ...updates.subscription };
        }
      } else {
        // Remove Pro
        updates.subscription = {
          tier: 'free',
          status: 'canceled',
        };
        // Preserve other subscription fields if they exist
        if (userData.subscription && typeof userData.subscription === 'object') {
          updates.subscription = { ...userData.subscription, ...updates.subscription };
        }
      }
    }

    console.log('[Admin Update] Applying updates:', updates);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    await updateDoc(userRef, updates);

    // Fetch updated user data
    const updatedSnap = await getDoc(userRef);
    const updatedData = updatedSnap.data();

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedSnap.id,
        email: updatedData?.email,
        displayName: updatedData?.displayName,
        username: updatedData?.username,
        subscription: updatedData?.subscription,
        features: updatedData?.features,
      },
    });
  } catch (error: any) {
    console.error('[Admin Update User Access] Error:', error);
    console.error('[Admin Update User Access] Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update user access',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
