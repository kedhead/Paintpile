/**
 * Firebase Admin SDK Utility
 *
 * Server-side Firebase Admin SDK for privileged operations like:
 * - Setting custom claims
 * - Managing users
 * - Bypassing security rules
 *
 * IMPORTANT: Only use in API routes, never in client-side code
 */

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App | undefined;

/**
 * Initialize Firebase Admin SDK
 * Uses serviceAccountKey.json from project root (local dev)
 * OR environment variables (production/Vercel)
 */
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  try {
    // Try to initialize using environment variables first (for Vercel/production)
    if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin SDK initialized from environment variables');
      return adminApp;
    }

    // Fallback to serviceAccountKey.json for local development
    // Only try to load file in Node.js environment (not during build)
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
      try {
        // Dynamic import to avoid bundling issues
        const path = require('path');
        const fs = require('fs');
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          adminApp = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });
          console.log('✅ Firebase Admin SDK initialized from serviceAccountKey.json');
          return adminApp;
        }
      } catch (error) {
        // File doesn't exist, continue to error
      }
    }

    throw new Error(
      'Firebase Admin SDK credentials not found! ' +
      'Set FIREBASE_ADMIN_CREDENTIALS environment variable or add serviceAccountKey.json'
    );
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth() {
  const app = getAdminApp();
  return getAuth(app);
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminFirestore() {
  const app = getAdminApp();
  const firestore = getFirestore(app);
  try {
    firestore.settings({ ignoreUndefinedProperties: true });
  } catch (error) {
    // Settings might have been already set, ignore error
  }
  return firestore;
}

/**
 * Get Firebase Admin Storage instance
 */
export function getAdminStorage() {
  const app = getAdminApp();
  return getStorage(app);
}

/**
 * Set custom claims on a user
 *
 * @param uid - User ID
 * @param claims - Custom claims object (e.g., { admin: true })
 */
export async function setUserCustomClaims(uid: string, claims: Record<string, any>) {
  const auth = getAdminAuth();
  await auth.setCustomUserClaims(uid, claims);
  console.log(`✅ Custom claims set for user ${uid}:`, claims);
}

/**
 * Get user's custom claims
 *
 * @param uid - User ID
 * @returns User's custom claims
 */
export async function getUserCustomClaims(uid: string): Promise<Record<string, any>> {
  const auth = getAdminAuth();
  const user = await auth.getUser(uid);
  return user.customClaims || {};
}

/**
 * Grant admin access to a user
 *
 * @param uid - User ID
 */
export async function grantAdminAccess(uid: string) {
  await setUserCustomClaims(uid, { admin: true });
}

/**
 * Revoke admin access from a user
 *
 * @param uid - User ID
 */
export async function revokeAdminAccess(uid: string) {
  await setUserCustomClaims(uid, { admin: false });
}

/**
 * Check if a user is an admin
 *
 * @param uid - User ID
 * @returns true if user has admin claim
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  const claims = await getUserCustomClaims(uid);
  return claims.admin === true;
}
