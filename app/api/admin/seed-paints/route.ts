import { NextRequest, NextResponse } from 'next/server';
import { seedPaintDatabase } from '@/lib/firestore/paints';

// Force Node.js runtime (not Edge) for Firebase compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin API route for seeding the paint database
 * GET /api/admin/seed-paints - Shows status
 * POST /api/admin/seed-paints - Seeds the database
 *
 * Security: Add authorization check in production!
 */
export async function GET(request: NextRequest) {
  try {
    const { getAllPaints } = await import('@/lib/firestore/paints');
    const allPaints = await getAllPaints();

    // Group by brand
    const brandCounts: Record<string, number> = {};
    allPaints.forEach(p => {
      brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    });

    return NextResponse.json({
      message: 'Paint database status',
      totalPaints: allPaints.length,
      brandCounts,
      endpoint: '/api/admin/seed-paints',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch paint stats' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add auth check here - only allow admin users
    console.log('Starting paint database seeding...');

    // Check if paints already exist
    const { getAllPaints } = await import('@/lib/firestore/paints');
    const existingPaints = await getAllPaints();

    // We now allow syncing (appending) so we don't block if paints exist.
    // However, we can log it.
    if (existingPaints.length > 0) {
      console.log(`Database already has ${existingPaints.length} paints. Syncing new paints...`);
    } else {
      console.log('Database empty. Performing full seed...');
    }

    const count = await seedPaintDatabase();

    console.log(`Successfully seeded ${count} paints`);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${count} paints`,
      count,
    });
  } catch (error: any) {
    console.error('Paint seeding failed:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Paint seeding failed',
        details: error.stack || 'No stack trace available',
      },
      { status: 500 }
    );
  }
}
