/**
 * POST /api/admin/search-user
 *
 * Search for a user by email (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

// Admin API route for user search

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Search for user by email using Admin SDK
    const db = getAdminFirestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        userId: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        username: userData.username,
        subscription: userData.subscription,
        features: userData.features,
      },
    });
  } catch (error: any) {
    console.error('[Admin Search User] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search user' },
      { status: 500 }
    );
  }
}
