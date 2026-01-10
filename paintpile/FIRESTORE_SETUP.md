# Firestore Rules & Indexes Setup

## Issue: "Missing or insufficient permissions" Error

This error occurs when Firestore security rules haven't been deployed to Firebase yet.

## Solution: Deploy Firestore Rules

You need to deploy the Firestore security rules from your local `firestore.rules` file to your Firebase project.

### Steps:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Accept the default `firestore.rules` file
   - Accept the default `firestore.indexes.json` file

4. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Deploy Firestore Indexes** (optional, for better query performance):
   ```bash
   firebase deploy --only firestore:indexes
   ```

   Or deploy both at once:
   ```bash
   firebase deploy --only firestore
   ```

## What This Does

- **firestore.rules**: Updates security rules to allow proper access to:
  - Public recipes (anyone can read)
  - User recipes (only owner can modify)
  - Project recipes (owner access)
  - Paint database (read access for all)

- **firestore.indexes.json**: Creates composite indexes for:
  - Recipe queries (isPublic + createdAt)
  - User recipe queries (userId + createdAt)
  - Saved recipes (userId + savedAt)

## Verification

After deploying:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** > **Rules**
4. Verify the rules match your local `firestore.rules` file
5. Check the **Indexes** tab to see the composite indexes

## Common Issues

### "Permission denied" when deploying
- Make sure you're logged in: `firebase login`
- Make sure you've selected the right project: `firebase use <project-id>`

### Rules still not working after deploy
- Wait 1-2 minutes for rules to propagate
- Clear browser cache and refresh
- Check Firebase Console to confirm rules are deployed

### Admin API 404 Errors
- This is likely a Vercel deployment cache issue
- Try force redeploying in Vercel dashboard
- Or push a new commit to trigger fresh deployment
