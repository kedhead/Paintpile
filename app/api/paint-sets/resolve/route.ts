/**
 * POST /api/paint-sets/resolve
 *
 * Resolve a paint set to actual Paint objects from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaintSetById, searchPaintSets } from '@/lib/data/paint-sets';
import { resolvePaintSet } from '@/lib/data/paint-set-resolver';
import { getAllPaints } from '@/lib/firestore/paints';

export const runtime = 'nodejs';

interface RequestBody {
  setId?: string;        // Paint set ID (preferred)
  setName?: string;      // Or search by name
  brand?: string;        // Optional brand filter
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    // Validate input
    if (!body.setId && !body.setName) {
      return NextResponse.json(
        { success: false, error: 'Either setId or setName is required' },
        { status: 400 }
      );
    }

    // Find the paint set
    let paintSet;

    if (body.setId) {
      // Look up by ID
      paintSet = getPaintSetById(body.setId);
      if (!paintSet) {
        return NextResponse.json(
          { success: false, error: `Paint set not found: ${body.setId}` },
          { status: 404 }
        );
      }
    } else if (body.setName) {
      // Search by name
      const results = searchPaintSets(body.setName);

      if (results.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `No paint sets found matching: ${body.setName}`,
            suggestion: 'Try using AI import for unknown sets',
          },
          { status: 404 }
        );
      }

      // Filter by brand if specified
      if (body.brand) {
        const brandResults = results.filter(
          set => set.brand.toLowerCase() === body.brand!.toLowerCase()
        );
        paintSet = brandResults[0] || results[0];
      } else {
        paintSet = results[0];
      }
    }

    if (!paintSet) {
      return NextResponse.json(
        { success: false, error: 'Paint set not found' },
        { status: 404 }
      );
    }

    // Fetch all paints from database
    const allPaints = await getAllPaints();

    // DEBUG: Log ProAcryl/Monument paint debugging info
    if (paintSet.brand.toLowerCase().includes('proacryl') || paintSet.brand.toLowerCase().includes('monument')) {
      console.log(`[DEBUG] Resolving ${paintSet.brand} set: ${paintSet.setName}`);
      console.log(`[DEBUG] Total paints in database: ${allPaints.length}`);

      // Find all paints with ProAcryl or Monument in the brand name
      const proacrylPaints = allPaints.filter(p =>
        p.brand.toLowerCase().includes('proacryl') ||
        p.brand.toLowerCase().includes('monument')
      );
      console.log(`[DEBUG] Found ${proacrylPaints.length} ProAcryl/Monument paints in database`);
      console.log(`[DEBUG] Brands in database:`, Array.from(new Set(proacrylPaints.map(p => p.brand))));
      console.log(`[DEBUG] Sample paint names:`, proacrylPaints.slice(0, 10).map(p => p.name));

      console.log(`[DEBUG] Looking for these paint names from set:`, paintSet.paintNames.slice(0, 5));
    }

    // Resolve the paint set to actual Paint objects
    const resolved = resolvePaintSet(paintSet, allPaints);

    // Return the results
    return NextResponse.json({
      success: true,
      set: {
        setId: resolved.set.setId,
        setName: resolved.set.setName,
        brand: resolved.set.brand,
        paintCount: resolved.set.paintCount,
        description: resolved.set.description,
        isCurated: resolved.set.isCurated,
      },
      paints: resolved.matchedPaints,
      matchedCount: resolved.matchedPaints.length,
      unmatchedCount: resolved.unmatchedNames.length,
      unmatchedNames: resolved.unmatchedNames,
      matchRate: Math.round(resolved.matchRate),
      warning:
        resolved.matchRate < 100
          ? `Only ${Math.round(resolved.matchRate)}% of paints were matched. ${resolved.unmatchedNames.length} paints not found in database.`
          : undefined,
    });
  } catch (error: any) {
    console.error('[Paint Set Resolve] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve paint set' },
      { status: 500 }
    );
  }
}
