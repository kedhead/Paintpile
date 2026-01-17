import { NextRequest, NextResponse } from 'next/server';
import { MonumentAIGenerator, ArmyPainterAIGenerator, CitadelAIGenerator, VallejoAIGenerator } from '@/lib/generators/brand-generators';
import { PaintSetScraperResult } from '@/lib/scrapers/paint-set-scraper-base';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for scraping

/**
 * POST /api/admin/scrape-paint-sets
 *
 * Run paint set scrapers for specified brands
 */
export async function POST(request: NextRequest) {
  try {
    const { brands } = await request.json();

    // Verify Admin Authentication
    const { verifyAuth, unauthorizedResponse, forbiddenResponse } = await import('@/lib/auth/server-auth');
    const auth = await verifyAuth(request);

    if (!auth) {
      return unauthorizedResponse('You must be logged in');
    }

    if (!auth.isAdmin) {
      return forbiddenResponse('Admin access required');
    }

    if (!brands || !Array.isArray(brands) || brands.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No brands specified' },
        { status: 400 }
      );
    }

    console.log(`[Paint Set Scraper] Starting scrape for brands: ${brands.join(', ')}`);

    const results: PaintSetScraperResult[] = [];

    // Run each scraper
    for (const brand of brands) {
      try {
        console.log(`\n[Paint Set Scraper] Scraping ${brand}...`);

        let result: PaintSetScraperResult;

        switch (brand.toLowerCase()) {
          case 'monument':
          case 'proacryl':
            // Keep original scraper for Monument if it works, or switch to AI. Let's start with AI for consistency.
            // Actually, user only complained about Citadel/ArmyPainter. Let's keep Monument web scraper if it was working,
            // but the user requested "scraper is not working... is there another tool".
            // To be safe and consistent, let's use AI for all problematic ones.
            // Wait, I'll keep Monument web scraper if I didn't import the AI one.
            // I'll stick to the new plan: ALL AI GENERATORS for robust results.
            const monumentGen = new MonumentAIGenerator();
            result = await monumentGen.generate();
            break;

          case 'army painter':
          case 'armypainter':
            const armyPainterGen = new ArmyPainterAIGenerator();
            result = await armyPainterGen.generate();
            break;

          case 'citadel':
          case 'games workshop':
            const citadelGen = new CitadelAIGenerator();
            result = await citadelGen.generate();
            break;

          case 'vallejo':
            const vallejoGen = new VallejoAIGenerator();
            result = await vallejoGen.generate();
            break;

          default:
            console.log(`[Paint Set Scraper] Unknown brand: ${brand}`);
            continue;
        }

        results.push(result);
        console.log(`[Paint Set Scraper] ${brand}: Found ${result.sets.length} sets`);
      } catch (error: any) {
        console.error(`[Paint Set Scraper] Error scraping ${brand}:`, error);
        results.push({
          brand,
          sets: [],
          scrapedAt: new Date(),
          errors: [error.message],
        });
      }
    }

    // Calculate totals
    const totalSets = results.reduce((sum, r) => sum + r.sets.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`\n[Paint Set Scraper] Complete: ${totalSets} sets, ${totalErrors} errors`);

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          totalSets,
          totalErrors,
          brands: results.map(r => r.brand),
        },
      },
    });
  } catch (error: any) {
    console.error('[Paint Set Scraper] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Scraping failed',
      },
      { status: 500 }
    );
  }
}
