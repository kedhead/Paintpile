import { NextRequest, NextResponse } from 'next/server';
import { getAllPaints } from '@/lib/firestore/paints';
import { COMPREHENSIVE_PAINTS } from '@/lib/data/comprehensive-paints';
import { db } from '@/lib/firebase/admin';
import { collection, doc, setDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/update-monument-paints
 *
 * Deletes all existing ProAcryl paints and replaces them with the updated Monument paint list.
 * This is useful when you've updated the ProAcryl section of comprehensive-paints.ts
 * without needing to reseed the entire database.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Update Monument] Starting Monument/ProAcryl paint update...');

    // Get all existing paints
    const allPaints = await getAllPaints();
    console.log(`[Update Monument] Total paints in database: ${allPaints.length}`);

    // Find all ProAcryl paints in database
    const existingProAcryl = allPaints.filter(p =>
      p.brand.toLowerCase().includes('proacryl') ||
      p.brand.toLowerCase().includes('monument')
    );
    console.log(`[Update Monument] Found ${existingProAcryl.length} existing ProAcryl/Monument paints to delete`);

    // Delete all existing ProAcryl paints
    const paintsRef = collection(db, 'paints');
    let deletedCount = 0;

    for (const paint of existingProAcryl) {
      await deleteDoc(doc(paintsRef, paint.paintId));
      deletedCount++;
    }
    console.log(`[Update Monument] Deleted ${deletedCount} old ProAcryl paints`);

    // Get new ProAcryl paints from comprehensive database
    const newProAcrylPaints = COMPREHENSIVE_PAINTS.filter(p => p.brand === 'ProAcryl');
    console.log(`[Update Monument] Adding ${newProAcrylPaints.length} new ProAcryl paints`);

    // Add all new ProAcryl paints
    let addedCount = 0;
    for (const paint of newProAcrylPaints) {
      const paintRef = doc(paintsRef);
      await setDoc(paintRef, {
        paintId: paintRef.id,
        ...paint,
      });
      addedCount++;
    }

    console.log(`[Update Monument] Successfully updated Monument paints: deleted ${deletedCount}, added ${addedCount}`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated Monument/ProAcryl paints`,
      deleted: deletedCount,
      added: addedCount,
      samplePaints: newProAcrylPaints.slice(0, 5).map(p => p.name),
    });

  } catch (error: any) {
    console.error('[Update Monument] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update Monument paints',
        details: error.stack || 'No stack trace available',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Monument Paint Update Endpoint',
    instructions: 'Send a POST request to delete all existing ProAcryl paints and replace with updated Monument paint list',
    endpoint: '/api/admin/update-monument-paints',
  });
}
