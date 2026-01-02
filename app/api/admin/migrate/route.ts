import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * Admin API route for running database migrations
 * POST /api/admin/migrate
 *
 * Security: Add authorization check in production!
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add auth check here - only allow admin users
    // Example: const session = await getServerSession();
    // if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    console.log('Starting migrations...');

    // Run all migrations
    const results = {
      projects: await migrateProjectSocialCounts(),
      usernames: await migrateUsernameLower(),
      userStats: await migrateUserSocialStats(),
    };

    return NextResponse.json({
      success: true,
      message: 'All migrations completed successfully',
      results,
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Migration failed',
      },
      { status: 500 }
    );
  }
}

async function migrateProjectSocialCounts() {
  const projectsRef = collection(db, 'projects');
  const snapshot = await getDocs(projectsRef);

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

  return { total: snapshot.size, migrated: migratedCount };
}

async function migrateUsernameLower() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

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

  return { total: snapshot.size, migrated: migratedCount };
}

async function migrateUserSocialStats() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

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

  return { total: snapshot.size, migrated: migratedCount };
}
