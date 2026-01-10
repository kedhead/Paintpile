import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

// Force Node.js runtime (not Edge) for Firebase compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin API route for running database migrations
 * GET /api/admin/migrate - Shows status
 * POST /api/admin/migrate - Runs migrations
 *
 * Security: Add authorization check in production!
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Migration endpoint ready',
    instructions: 'Send a POST request to this endpoint to run migrations',
    endpoint: '/api/admin/migrate',
  });
}

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

    console.log('Migrations completed successfully:', results);

    return NextResponse.json({
      success: true,
      message: 'All migrations completed successfully',
      results,
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Migration failed',
        details: error.stack || 'No stack trace available',
      },
      { status: 500 }
    );
  }
}

async function migrateProjectSocialCounts() {
  const db = getAdminFirestore();
  const projectsRef = db.collection('projects');
  const snapshot = await projectsRef.get();

  const batchSize = 500;
  let batch = db.batch();
  let batchCount = 0;
  let migratedCount = 0;

  for (const projectDoc of snapshot.docs) {
    const projectData = projectDoc.data();

    if (projectData.likeCount === undefined || projectData.commentCount === undefined) {
      batch.update(projectDoc.ref, {
        likeCount: projectData.likeCount ?? 0,
        commentCount: projectData.commentCount ?? 0,
      });

      batchCount++;
      migratedCount++;

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = db.batch();
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
  const db = getAdminFirestore();
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  const batchSize = 500;
  let batch = db.batch();
  let batchCount = 0;
  let migratedCount = 0;

  for (const userDoc of snapshot.docs) {
    const userData = userDoc.data();

    if (userData.username && userData.usernameLower === undefined) {
      batch.update(userDoc.ref, {
        usernameLower: userData.username.toLowerCase(),
      });

      batchCount++;
      migratedCount++;

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = db.batch();
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
  const db = getAdminFirestore();
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  const batchSize = 500;
  let batch = db.batch();
  let batchCount = 0;
  let migratedCount = 0;

  for (const userDoc of snapshot.docs) {
    const userData = userDoc.data();

    if (
      userData.stats?.followerCount === undefined ||
      userData.stats?.followingCount === undefined
    ) {
      batch.update(userDoc.ref, {
        'stats.followerCount': userData.stats?.followerCount ?? 0,
        'stats.followingCount': userData.stats?.followingCount ?? 0,
      });

      batchCount++;
      migratedCount++;

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return { total: snapshot.size, migrated: migratedCount };
}
