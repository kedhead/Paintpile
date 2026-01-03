# Grant Admin Access Guide

This guide will help you grant admin access to your user account using Firebase Custom Claims.

## What Changed

The admin system has been upgraded to use **Firebase Custom Claims** instead of hardcoded email checks:

- **Before**: Admin check was hardcoded to `kendalldavis1@gmail.com`
- **After**: Admin status is stored in Firebase Auth custom claims (secure, server-side only)

## Benefits of Custom Claims

1. **Secure**: Custom claims are stored in the user's Firebase Auth token and cannot be modified by users
2. **Scalable**: You can grant admin access to multiple users
3. **Persistent**: Claims persist across sessions until explicitly revoked
4. **Fast**: Claims are checked in the auth token, no database query needed

## Step 1: Ensure Service Account Key Exists

You need a Firebase Admin SDK service account key to run the admin grant script.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (⚙️ icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the downloaded file as `serviceAccountKey.json` in your project root (K:\AI-Projects\paintpile\)

**Important**: The `serviceAccountKey.json` file should already be in your `.gitignore` to prevent committing it to version control.

## Step 2: Run the Grant Admin Script

Run the following command to grant admin access to your user account:

```bash
npx tsx scripts/grant-admin.ts 96QWNOU5vVgcAJN20PETgv8EDJ92
```

This will:
- Connect to Firebase using the Admin SDK
- Set the `admin: true` custom claim on your user account
- Show confirmation of the change

Expected output:
```
🔄 Granting admin access to user: 96QWNOU5vVgcAJN20PETgv8EDJ92

📋 User Details:
   Email: [your-email]
   Display Name: [your-name]
   UID: 96QWNOU5vVgcAJN20PETgv8EDJ92
   Created: [date]

📋 Current Custom Claims: {}

✅ Admin access granted successfully!

✅ Verified Custom Claims: { admin: true }
```

## Step 3: Deploy Updated Firestore Rules

The Firestore security rules have been updated to check for the `admin` custom claim:

```bash
firebase deploy --only firestore:rules
```

This updates the `isAdmin()` function to check:
```javascript
function isAdmin() {
  return request.auth != null &&
         request.auth.token.admin == true;
}
```

## Step 4: Sign Out and Sign In

**Important**: Custom claims are cached in your Firebase Auth token. You must sign out and sign back in for the changes to take effect.

1. Sign out of your account
2. Sign back in
3. Your new auth token will include the `admin: true` claim

## Step 5: Verify Admin Access

After signing back in:

1. Navigate to `/admin`
2. You should see the Admin Panel (no "Access Denied" message)
3. Try accessing `/admin/manage-users`
4. You should be able to grant AI access and Pro subscriptions to other users

## Files Created/Modified

### New Files

1. **`lib/firebase/admin.ts`** - Firebase Admin SDK utility functions
2. **`lib/auth/admin-check.ts`** - Client-side admin check using custom claims
3. **`app/api/admin/grant-admin/route.ts`** - API endpoint for granting admin (for future use)
4. **`scripts/grant-admin.ts`** - One-time script to grant admin access

### Modified Files

1. **`firestore.rules`** - Updated `isAdmin()` to check custom claims
2. **`app/(protected)/admin/page.tsx`** - Added admin check using custom claims
3. **`app/(protected)/admin/manage-users/page.tsx`** - Updated admin check to use custom claims

## Granting Admin to Additional Users

To grant admin access to another user in the future:

1. Find their User ID from Firestore or the user management page
2. Run the script:
   ```bash
   npx tsx scripts/grant-admin.ts <USER_ID>
   ```

## Revoking Admin Access

To revoke admin access from a user:

```bash
# Modify the script or create a new one to set admin: false
# Or manually use the Firebase Admin SDK in a Node.js script
```

Or update the `scripts/grant-admin.ts` file to accept a `--revoke` flag.

## Troubleshooting

### "Access Denied" after running script

- Make sure you signed out and signed back in
- Check browser console for any errors
- Verify the Firestore rules were deployed successfully

### Script fails with "serviceAccountKey.json not found"

- Download the service account key from Firebase Console
- Place it in the project root directory
- Ensure the filename is exactly `serviceAccountKey.json`

### Custom claims not appearing

- Custom claims can take a few minutes to propagate
- Force a token refresh by signing out/in
- Or call `getIdToken(true)` to force refresh without signing out

## Security Notes

1. The `serviceAccountKey.json` file grants full admin access to your Firebase project - keep it secret
2. Custom claims are secure and cannot be modified by users
3. The old hardcoded email check has been removed
4. Admin status is now checked server-side via Firestore rules

## Next Steps

After granting yourself admin access:

1. Test the admin panel at `/admin`
2. Try granting AI access to a test user
3. Verify the Firestore rules are working correctly
4. Consider adding additional admins if needed
