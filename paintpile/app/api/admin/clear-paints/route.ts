import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

// Force Node.js runtime (not Edge) for Firebase compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin API route for clearing all paints from the database
 * POST /api/admin/clear-paints
 *
 * Security: Add authorization check in production!
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting paint database clearing...');

    const db = getAdminFirestore();
    const paintsRef = db.collection('paints');
    const snapshot = await paintsRef.get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Database is already empty',
        count: 0,
      });
    }

    // Delete in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;
    let totalDeleted = 0;

    for (const paintDoc of snapshot.docs) {
      batch.delete(paintDoc.ref);
      batchCount++;
      totalDeleted++;

      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`Deleted batch of ${batchCount} paints`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Deleted final batch of ${batchCount} paints`);
    }

    console.log(`Successfully deleted ${totalDeleted} paints`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${totalDeleted} paints`,
      count: totalDeleted,
    });
  } catch (error: any) {
    console.error('Paint clearing failed:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Paint clearing failed',
        details: error.stack || 'No stack trace available',
      },
      { status: 500 }
    );
  }
}
