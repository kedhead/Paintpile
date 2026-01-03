/**
 * Admin Check Utilities
 *
 * Client-side utilities for checking admin status using Firebase Custom Claims
 */

import { User } from 'firebase/auth';

/**
 * Check if current user has admin custom claim
 *
 * @param user - Firebase Auth user
 * @returns Promise<boolean> - true if user has admin claim
 */
export async function isUserAdmin(user: User | null): Promise<boolean> {
  if (!user) {
    return false;
  }

  try {
    // Get fresh ID token with custom claims
    const idTokenResult = await user.getIdTokenResult();

    // Check for admin custom claim
    return idTokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Force refresh the user's ID token to get latest custom claims
 *
 * Use this after granting admin access to a user, so they don't have to sign out/in
 *
 * @param user - Firebase Auth user
 */
export async function refreshAdminClaims(user: User): Promise<void> {
  try {
    // Force refresh the token to get latest custom claims
    await user.getIdToken(true);
    console.log('✅ Admin claims refreshed');
  } catch (error) {
    console.error('Error refreshing admin claims:', error);
    throw error;
  }
}
