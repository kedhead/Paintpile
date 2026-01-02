import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';

/**
 * Migration script to add usernameLower field to existing users
 * This enables case-insensitive username lookups
 */
async function migrateUsernameLower() {
  console.log('Starting username lowercase migration...');

  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    console.log(`Found ${snapshot.size} users to migrate`);

    // Use batched writes for better performance (max 500 per batch)
    const batchSize = 500;
    let batch = writeBatch(db);
    let batchCount = 0;
    let migratedCount = 0;
    let skippedCount = 0;

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();

      // Only update if user has a username and usernameLower doesn't exist
      if (userData.username && userData.usernameLower === undefined) {
        const userRef = doc(db, 'users', userDoc.id);
        batch.update(userRef, {
          usernameLower: userData.username.toLowerCase(),
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
      } else {
        skippedCount++;
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }

    console.log(`✅ Migration complete! Updated ${migratedCount} users`);
    console.log(`Skipped ${skippedCount} users (no username or already migrated)`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateUsernameLower()
  .then(() => {
    console.log('Migration finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
