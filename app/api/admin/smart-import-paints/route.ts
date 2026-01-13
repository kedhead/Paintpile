import { NextRequest, NextResponse } from 'next/server';
import { smartImportPaints, smartSeedPaintDatabase } from '@/lib/firestore/paints-smart-import';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large imports

/**
 * POST /api/admin/smart-import-paints
 *
 * Smart import that skips duplicates
 *
 * Body:
 * {
 *   source: 'seed' | 'custom',
 *   paints?: Paint[], // Required if source is 'custom'
 *   updateExisting?: boolean, // Update existing paints if found
 *   dryRun?: boolean // Preview what would happen
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, paints, updateExisting = false, dryRun = false } = body;

    console.log('[Smart Import] Starting...');
    console.log(`[Smart Import] Source: ${source}`);
    console.log(`[Smart Import] Update existing: ${updateExisting}`);
    console.log(`[Smart Import] Dry run: ${dryRun}`);

    let result;

    if (source === 'seed') {
      // Import from comprehensive database
      if (dryRun) {
        // For dry run, we need to use the full smartImportPaints
        const { COMPREHENSIVE_PAINTS } = await import('@/lib/data/comprehensive-paints');
        result = await smartImportPaints(COMPREHENSIVE_PAINTS, {
          updateExisting,
          dryRun: true,
        });
      } else {
        const counts = await smartSeedPaintDatabase(updateExisting);
        result = {
          ...counts,
          errors: [],
          addedPaints: [],
          skippedPaints: [],
          updatedPaints: [],
        };
      }
    } else if (source === 'custom') {
      // Import custom paints
      if (!paints || !Array.isArray(paints)) {
        return NextResponse.json(
          { success: false, error: 'Paints array is required for custom import' },
          { status: 400 }
        );
      }

      result = await smartImportPaints(paints, {
        updateExisting,
        dryRun,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid source. Must be "seed" or "custom"' },
        { status: 400 }
      );
    }

    console.log('[Smart Import] Complete!');
    console.log(`  Added: ${result.added}`);
    console.log(`  Skipped: ${result.skipped}`);
    console.log(`  Updated: ${result.updated}`);
    console.log(`  Errors: ${result.errors.length}`);

    return NextResponse.json({
      success: true,
      data: {
        added: result.added,
        skipped: result.skipped,
        updated: result.updated,
        errors: result.errors,
        dryRun,
        // Include details for dry run
        ...(dryRun && {
          addedPaints: result.addedPaints.map(p => ({ brand: p.brand, name: p.name })),
          skippedPaints: result.skippedPaints,
          updatedPaints: result.updatedPaints.map(p => ({ brand: p.brand, name: p.name })),
        }),
      },
    });
  } catch (error: any) {
    console.error('[Smart Import] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Import failed',
      },
      { status: 500 }
    );
  }
}
