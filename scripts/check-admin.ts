/**
 * Check Admin Status Script
 *
 * Verifies if a user has the admin custom claim set
 *
 * Usage:
 *   npx tsx scripts/check-admin.ts <USER_ID>
 *
 * Example:
 *   npx tsx scripts/check-admin.ts 96QWNOU5vVgcAJN20PETgv8EDJ92
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
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();

async function checkAdminStatus(userId: string) {
  console.log(`\n🔍 Checking admin status for user: ${userId}\n`);

  try {
    // Get user info
    const user = await auth.getUser(userId);
    console.log('📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.displayName || 'N/A'}`);
    console.log(`   UID: ${user.uid}`);

    // Check custom claims
    const customClaims = user.customClaims || {};
    console.log('\n🔑 Custom Claims:', JSON.stringify(customClaims, null, 2));

    const isAdmin = customClaims.admin === true;

    if (isAdmin) {
      console.log('\n✅ SUCCESS: User has admin access!');
      console.log('   The admin custom claim is set correctly.');
    } else {
      console.log('\n❌ NOT ADMIN: User does NOT have admin access.');
      console.log('   The admin custom claim is missing or set to false.');
      console.log('\n💡 To grant admin access, run:');
      console.log(`   npx tsx scripts/grant-admin.ts ${userId}`);
    }

    console.log('\n📝 Next Steps:');
    if (isAdmin) {
      console.log('   1. Make sure the user signs out and signs back in');
      console.log('   2. The new token will include the admin claim');
      console.log('   3. Navigate to /admin/debug to verify the claim is in the token');
    } else {
      console.log('   1. Run the grant-admin script (see command above)');
      console.log('   2. User must sign out and sign back in');
      console.log('   3. Check token at /admin/debug');
    }

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
  console.error('   npx tsx scripts/check-admin.ts <USER_ID>');
  console.error('\nExample:');
  console.error('   npx tsx scripts/check-admin.ts 96QWNOU5vVgcAJN20PETgv8EDJ92');
  process.exit(1);
}

// Run the script
checkAdminStatus(userId)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
