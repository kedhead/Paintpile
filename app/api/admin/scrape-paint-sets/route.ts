import { NextRequest, NextResponse } from 'next/server';
import { MonumentSetScraperAI } from '@/lib/scrapers/monument-set-scraper-ai';
import { ArmyPainterSetScraperAI } from '@/lib/scrapers/army-painter-set-scraper-ai';
import { CitadelSetScraperAI } from '@/lib/scrapers/citadel-set-scraper-ai';
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
            const monumentScraper = new MonumentSetScraperAI();
            result = await monumentScraper.scrape();
            break;

          case 'army painter':
          case 'armypainter':
            const armyPainterScraper = new ArmyPainterSetScraperAI();
            result = await armyPainterScraper.scrape();
            break;

          case 'citadel':
          case 'games workshop':
            const citadelScraper = new CitadelSetScraperAI();
            result = await citadelScraper.scrape();
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
