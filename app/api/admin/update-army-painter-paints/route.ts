import { NextRequest, NextResponse } from 'next/server';
import { COMPREHENSIVE_PAINTS } from '@/lib/data/comprehensive-paints';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/update-army-painter-paints
 *
 * Deletes all existing Army Painter paints and replaces them with the updated paint list.
 * This includes Fanatic paints and Speedpaint 2.0 paints.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Update Army Painter] Starting Army Painter paint update...');

    const db = getAdminFirestore();
    const paintsRef = db.collection('paints');

    // Get all existing paints
    const allPaintsSnapshot = await paintsRef.get();
    console.log(`[Update Army Painter] Total paints in database: ${allPaintsSnapshot.size}`);

    // Find all Army Painter paints in database (including Fanatic)
    const existingArmyPainter: any[] = [];
    allPaintsSnapshot.forEach(doc => {
      const paint = doc.data();
      if (paint.brand && paint.brand.toLowerCase().includes('army painter')) {
        existingArmyPainter.push({ id: doc.id, ...paint });
      }
    });
    console.log(`[Update Army Painter] Found ${existingArmyPainter.length} existing Army Painter paints to delete`);

    // Delete all existing Army Painter paints
    let deletedCount = 0;
    for (const paint of existingArmyPainter) {
      await paintsRef.doc(paint.id).delete();
      deletedCount++;
    }
    console.log(`[Update Army Painter] Deleted ${deletedCount} old Army Painter paints`);

    // Get new Army Painter paints from comprehensive database
    const newArmyPainterPaints = COMPREHENSIVE_PAINTS.filter(p =>
      p.brand === 'Army Painter' || p.brand === 'Army Painter Fanatic'
    );
    console.log(`[Update Army Painter] Adding ${newArmyPainterPaints.length} new Army Painter paints`);

    // Add all new Army Painter paints
    let addedCount = 0;
    for (const paint of newArmyPainterPaints) {
      const newDocRef = paintsRef.doc();
      await newDocRef.set({
        paintId: newDocRef.id,
        ...paint,
      });
      addedCount++;
    }

    console.log(`[Update Army Painter] Successfully updated Army Painter paints: deleted ${deletedCount}, added ${addedCount}`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated Army Painter paints (Fanatic + Speedpaint 2.0)`,
      deleted: deletedCount,
      added: addedCount,
      samplePaints: newArmyPainterPaints.slice(0, 5).map(p => `${p.brand} - ${p.name}`),
    });

  } catch (error: any) {
    console.error('[Update Army Painter] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update Army Painter paints',
        details: error.stack || 'No stack trace available',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Army Painter Paint Update Endpoint',
    instructions: 'Send a POST request to delete all existing Army Painter paints and replace with updated list (Fanatic + Speedpaint 2.0)',
    endpoint: '/api/admin/update-army-painter-paints',
  });
}
