# Migration Scripts

This directory contains database migration scripts for PaintPile.

## Social Features Migration

The social features migration adds the following fields to existing data:

### Projects Collection
- `likeCount: number` - Count of likes (initialized to 0)
- `commentCount: number` - Count of comments (initialized to 0)

### Users Collection
- `usernameLower: string` - Lowercase version of username for case-insensitive lookups
- `stats.followerCount: number` - Count of followers (initialized to 0)
- `stats.followingCount: number` - Count of following (initialized to 0)

## Running Migrations

### Option 1: Run All Migrations (Recommended)

Run all social feature migrations in sequence:

```bash
npx tsx scripts/migrate-all-social.ts
```

### Option 2: Run Individual Migrations

Run specific migrations independently:

```bash
# Add social counts to projects
npx tsx scripts/migrate-social-counts.ts

# Add usernameLower to users
npx tsx scripts/migrate-username-lower.ts

# Add social stats to users
npx tsx scripts/migrate-user-stats.ts
```

## Requirements

- Firebase credentials must be configured in `.env.local`
- You must have write access to the Firestore database
- The `tsx` package must be installed (comes with Next.js dev dependencies)

## Safety Features

All migration scripts:
- ✅ Are idempotent (safe to run multiple times)
- ✅ Skip already-migrated documents
- ✅ Use batched writes for performance (500 documents per batch)
- ✅ Provide detailed logging of progress
- ✅ Use null coalescing to preserve existing values

## What Gets Updated?

The migrations only update documents that are missing the new fields. Documents that already have the fields are skipped automatically.

## Rollback

If you need to rollback (remove the new fields), you would need to create a reverse migration script or use the Firebase Console to delete the fields manually.

## Firestore Indexes

After running migrations, ensure these composite indexes exist in Firebase Console:

1. **projects** collection:
   - Fields: `userId` (Ascending), `isPublic` (Ascending), `updatedAt` (Descending)

2. **users** collection:
   - Fields: `username` (Ascending)

3. **follows** collection:
   - Fields: `followerId` (Ascending), `createdAt` (Descending)
   - Fields: `followingId` (Ascending), `createdAt` (Descending)

4. **likes** collection:
   - Fields: `userId` (Ascending), `projectId` (Ascending)
   - Fields: `projectId` (Ascending), `createdAt` (Descending)

## Troubleshooting

### Error: "Cannot find module '@/lib/firebase/firebase'"

Make sure you're running the script with `tsx` which supports TypeScript path aliases:
```bash
npx tsx scripts/migrate-all-social.ts
```

### Error: "Missing or insufficient permissions"

Check that:
1. Firebase credentials in `.env.local` are correct
2. The service account has write permissions to Firestore
3. Firestore security rules allow the operation

### Migration seems stuck

The scripts use batched writes which commit every 500 documents. For large databases, this is normal. Check the console output for progress updates.
