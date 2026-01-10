import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';

/**
 * Migration script to add social counts to existing projects
 * Adds: likeCount: 0, commentCount: 0
 */
async function migrateSocialCounts() {
  console.log('Starting project social counts migration...');

  try {
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);

    console.log(`Found ${snapshot.size} projects to migrate`);

    // Use batched writes for better performance (max 500 per batch)
    const batchSize = 500;
    let batch = writeBatch(db);
    let batchCount = 0;
    let migratedCount = 0;

    for (const projectDoc of snapshot.docs) {
      const projectData = projectDoc.data();

      // Only update if fields don't already exist
      if (projectData.likeCount === undefined || projectData.commentCount === undefined) {
        const projectRef = doc(db, 'projects', projectDoc.id);
        batch.update(projectRef, {
          likeCount: projectData.likeCount ?? 0,
          commentCount: projectData.commentCount ?? 0,
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

    console.log(`✅ Migration complete! Updated ${migratedCount} projects`);
    console.log(`Skipped ${snapshot.size - migratedCount} projects (already migrated)`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateSocialCounts()
  .then(() => {
    console.log('Migration finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
