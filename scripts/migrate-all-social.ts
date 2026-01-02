import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * Master migration script that runs all social feature migrations
 * This adds all necessary fields for the social features to existing data
 */

async function runAllMigrations() {
  console.log('🚀 Starting all social feature migrations...\n');

  try {
    // Migration 1: Add social counts to projects
    console.log('📊 Migration 1/3: Adding social counts to projects...');
    await migrateProjectSocialCounts();
    console.log('');

    // Migration 2: Add usernameLower to users
    console.log('👤 Migration 2/3: Adding usernameLower to users...');
    await migrateUsernameLower();
    console.log('');

    // Migration 3: Add social stats to users
    console.log('📈 Migration 3/3: Adding social stats to users...');
    await migrateUserSocialStats();
    console.log('');

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateProjectSocialCounts() {
  const projectsRef = collection(db, 'projects');
  const snapshot = await getDocs(projectsRef);

  console.log(`   Found ${snapshot.size} projects`);

  const batchSize = 500;
  let batch = writeBatch(db);
  let batchCount = 0;
  let migratedCount = 0;

  for (const projectDoc of snapshot.docs) {
    const projectData = projectDoc.data();

    if (projectData.likeCount === undefined || projectData.commentCount === undefined) {
      const projectRef = doc(db, 'projects', projectDoc.id);
      batch.update(projectRef, {
        likeCount: projectData.likeCount ?? 0,
        commentCount: projectData.commentCount ?? 0,
      });

      batchCount++;
      migratedCount++;

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`   ✓ Updated ${migratedCount} projects`);
}

async function migrateUsernameLower() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  console.log(`   Found ${snapshot.size} users`);

  const batchSize = 500;
  let batch = writeBatch(db);
  let batchCount = 0;
  let migratedCount = 0;

  for (const userDoc of snapshot.docs) {
    const userData = userDoc.data();

    if (userData.username && userData.usernameLower === undefined) {
      const userRef = doc(db, 'users', userDoc.id);
      batch.update(userRef, {
        usernameLower: userData.username.toLowerCase(),
      });

      batchCount++;
      migratedCount++;

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`   ✓ Updated ${migratedCount} users`);
}

async function migrateUserSocialStats() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  console.log(`   Found ${snapshot.size} users`);

  const batchSize = 500;
  let batch = writeBatch(db);
  let batchCount = 0;
  let migratedCount = 0;

  for (const userDoc of snapshot.docs) {
    const userData = userDoc.data();

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

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`   ✓ Updated ${migratedCount} users`);
}

// Run all migrations
runAllMigrations()
  .then(() => {
    console.log('\n🎉 All migrations finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
