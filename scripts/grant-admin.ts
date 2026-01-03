/**
 * One-Time Script: Grant Admin Access
 *
 * This script grants admin access to a user by setting custom claims on their Firebase Auth account.
 * Custom claims are stored in the user's authentication token and can only be set server-side.
 *
 * Usage:
 *   npx tsx scripts/grant-admin.ts <USER_ID>
 *
 * Example:
 *   npx tsx scripts/grant-admin.ts 96QWNOU5vVgcAJN20PETgv8EDJ92
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Please download your Firebase Admin SDK private key and place it in the project root.');
  console.error('Download from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();

async function grantAdminAccess(userId: string) {
  console.log(`\n🔄 Granting admin access to user: ${userId}\n`);

  try {
    // Get user info
    const user = await auth.getUser(userId);
    console.log('📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.displayName || 'N/A'}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Created: ${user.metadata.creationTime}`);

    // Check current custom claims
    const currentClaims = user.customClaims || {};
    console.log('\n📋 Current Custom Claims:', currentClaims);

    // Set admin custom claim
    await auth.setCustomUserClaims(userId, {
      ...currentClaims,
      admin: true,
    });

    console.log('\n✅ Admin access granted successfully!');

    // Verify the claim was set
    const updatedUser = await auth.getUser(userId);
    console.log('\n✅ Verified Custom Claims:', updatedUser.customClaims);

    console.log('\n📝 Next Steps:');
    console.log('   1. The user needs to sign out and sign back in for the changes to take effect');
    console.log('   2. After signing back in, their auth token will include the admin claim');
    console.log('   3. Firestore rules will recognize them as an admin');
    console.log('   4. They can now use the admin panel at /admin');

    console.log('\n⚠️  Important:');
    console.log('   - Custom claims are cached in the user\'s token');
    console.log('   - Force token refresh by signing out/in or calling getIdToken(true)');
    console.log('   - Update your Firestore rules to check: request.auth.token.admin == true');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('   User ID not found. Please check the UID is correct.');
    }
    throw error;
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.error('\nUsage:');
  console.error('   npx tsx scripts/grant-admin.ts <USER_ID>');
  console.error('\nExample:');
  console.error('   npx tsx scripts/grant-admin.ts 96QWNOU5vVgcAJN20PETgv8EDJ92');
  process.exit(1);
}

// Run the script
grantAdminAccess(userId)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
