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
    const { userId, aiEnabled, proTier } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const updates: any = {};

    // Update AI enabled flag
    if (aiEnabled !== undefined) {
      updates['features.aiEnabled'] = aiEnabled;
    }

    // Update Pro tier
    if (proTier !== undefined) {
      if (proTier) {
        // Grant Pro
        updates['subscription.tier'] = 'pro';
        updates['subscription.status'] = 'active';
        updates['subscription.currentPeriodStart'] = Timestamp.now();

        // Set current period end to 1 month from now
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        updates['subscription.currentPeriodEnd'] = Timestamp.fromDate(nextMonth);
      } else {
        // Remove Pro
        updates['subscription.tier'] = 'free';
        updates['subscription.status'] = 'canceled';
      }
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
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user access' },
      { status: 500 }
    );
  }
}
