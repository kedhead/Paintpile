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
import * as path from 'path';
import * as fs from 'fs';

let adminApp: App | undefined;

/**
 * Initialize Firebase Admin SDK
 * Uses serviceAccountKey.json from project root
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
    // Load service account key
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        'serviceAccountKey.json not found! Download from Firebase Console → Project Settings → Service Accounts'
      );
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    // Initialize app
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });

    console.log('✅ Firebase Admin SDK initialized');
    return adminApp;
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
  return getFirestore(app);
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
