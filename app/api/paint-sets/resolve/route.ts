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
