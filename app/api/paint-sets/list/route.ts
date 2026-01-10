/**
 * GET /api/paint-sets/list
 *
 * Get all available paint sets, optionally filtered by brand
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  CURATED_PAINT_SETS,
  getPaintSetBrands,
  getPaintSetsByBrand,
  searchPaintSets,
} from '@/lib/data/paint-sets';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const query = searchParams.get('query');

    let paintSets = CURATED_PAINT_SETS;

    // Filter by brand if specified
    if (brand) {
      paintSets = getPaintSetsByBrand(brand);
    }

    // Search if query provided
    if (query) {
      paintSets = searchPaintSets(query);
    }

    // Get all available brands
    const brands = getPaintSetBrands();

    // Group sets by brand
    const setsByBrand: Record<string, typeof CURATED_PAINT_SETS> = {};
    paintSets.forEach(set => {
      if (!setsByBrand[set.brand]) {
        setsByBrand[set.brand] = [];
      }
      setsByBrand[set.brand].push(set);
    });

    return NextResponse.json({
      success: true,
      sets: paintSets.map(set => ({
        setId: set.setId,
        setName: set.setName,
        brand: set.brand,
        paintCount: set.paintCount,
        description: set.description,
        isCurated: set.isCurated,
        releaseYear: set.releaseYear,
      })),
      setsByBrand,
      brands,
      totalSets: paintSets.length,
      curatedSets: paintSets.filter(s => s.isCurated).length,
    });
  } catch (error: any) {
    console.error('[Paint Sets List] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list paint sets' },
      { status: 500 }
    );
  }
}
