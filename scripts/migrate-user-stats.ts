import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';

/**
 * Migration script to add social stats to existing users
 * Adds: stats.followerCount: 0, stats.followingCount: 0
 */
async function migrateUserStats() {
  console.log('Starting user social stats migration...');

  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    console.log(`Found ${snapshot.size} users to migrate`);

    // Use batched writes for better performance (max 500 per batch)
    const batchSize = 500;
    let batch = writeBatch(db);
    let batchCount = 0;
    let migratedCount = 0;

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();

      // Only update if fields don't already exist
      if (
        userData.stats?.followerCount === undefined ||
        userData.stats?.followingCount === undefined
      ) {
        const userRef = doc(db, 'users', userDoc.id);
        batch.update(userRef, {
          'stats.followerCount': userData.stats?.followerCount ?? 0,
          'stats.followingCount': userData.stats?.followingCount ?? 0,
        });

        batchCount++;
        migratedCount++;

        // Commit batch if we hit the limit
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }

    console.log(`✅ Migration complete! Updated ${migratedCount} users`);
    console.log(`Skipped ${snapshot.size - migratedCount} users (already migrated)`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateUserStats()
  .then(() => {
    console.log('Migration finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
