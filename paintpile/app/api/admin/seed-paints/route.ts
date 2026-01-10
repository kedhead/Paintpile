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
  return NextResponse.json({
    message: 'Paint seeding endpoint ready',
    instructions: 'Send a POST request to this endpoint to seed the paint database with 235 paints',
    endpoint: '/api/admin/seed-paints',
  });
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add auth check here - only allow admin users
    console.log('Starting paint database seeding...');

    // Check if paints already exist
    const { getAllPaints } = await import('@/lib/firestore/paints');
    const existingPaints = await getAllPaints();

    if (existingPaints.length > 0) {
      console.log(`Database already has ${existingPaints.length} paints. Skipping seed.`);
      return NextResponse.json({
        success: false,
        error: `Database already contains ${existingPaints.length} paints. Please delete existing paints before seeding again.`,
        existingCount: existingPaints.length,
      }, { status: 400 });
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
