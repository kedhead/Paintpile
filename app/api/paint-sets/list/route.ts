/**
 * GET /api/paint-sets/list
 *
 * Get all available paint sets, optionally filtered by brand
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import {
  CURATED_PAINT_SETS,
} from '@/lib/data/paint-sets';
import { PaintSet } from '@/types/paint-set';

export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 1 minute

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandParam = searchParams.get('brand');
    const queryParam = searchParams.get('query');

    let paintSets: PaintSet[] = [];

    // 1. Try to fetch from Firestore
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection('paint-sets').get();

      if (!snapshot.empty) {
        paintSets = snapshot.docs.map(doc => doc.data() as PaintSet);
      } else {
        console.warn('[Paint Sets List] DB empty, using static fallback');
        paintSets = [...CURATED_PAINT_SETS];
      }
    } catch (dbError) {
      console.error('[Paint Sets List] DB fetch failed, using fallback:', dbError);
      paintSets = [...CURATED_PAINT_SETS];
    }

    // 2. Filter by brand
    if (brandParam) {
      paintSets = paintSets.filter(set =>
        set.brand.toLowerCase() === brandParam.toLowerCase()
      );
    }

    // 3. Search query
    if (queryParam) {
      const lowerQuery = queryParam.toLowerCase();
      paintSets = paintSets.filter(set =>
        set.setName.toLowerCase().includes(lowerQuery) ||
        set.brand.toLowerCase().includes(lowerQuery) ||
        set.description?.toLowerCase().includes(lowerQuery)
      );
    }

    // 4. Extract metadata
    // Get all available brands from the dataset
    const brandsSet = new Set(paintSets.map(set => set.brand));
    const brands = Array.from(brandsSet).sort();

    // Group sets by brand
    const setsByBrand: Record<string, PaintSet[]> = {};
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
        imageUrl: set.imageUrl,
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
