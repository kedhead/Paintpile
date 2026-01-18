
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { LiquitexScraper } from '@/lib/scrapers/liquitex-scraper';
import { ScrapedPaint } from '@/lib/scrapers/base-scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/admin/update-liquitex-paints
 *
 * Scrapes Liquitex website for Professional Acrylic Inks and updates Firestore.
 * Deletes existing 'Liquitex Professional Acrylic Ink' paints and replaces them.
 */
export async function POST(request: NextRequest) {
    try {
        // Verify Admin Authentication
        const { verifyAuth, unauthorizedResponse, forbiddenResponse } = await import('@/lib/auth/server-auth');
        const auth = await verifyAuth(request);

        if (!auth) {
            return unauthorizedResponse('You must be logged in');
        }

        if (!auth.isAdmin) {
            return forbiddenResponse('Admin access required');
        }

        console.log('[Update Liquitex] Starting Liquitex paint update...');

        // 1. Run Scraper
        const scraper = new LiquitexScraper();
        const scrapeResult = await scraper.scrape();

        if (scrapeResult.paints.length === 0) {
            throw new Error('Scraper returned 0 paints. Check logs.');
        }

        console.log(`[Update Liquitex] Scraper found ${scrapeResult.paints.length} paints`);

        // 2. Update Firestore
        const db = getAdminFirestore();
        const paintsRef = db.collection('paints');

        // Get all existing paints to find ones to delete
        // Optimization: Query by brand if possible, but schema might vary.
        // We'll fetch all and filter for safety, or query if we are sure about the brand string.
        // Previous pattern in update-monument-paints fetched all. Let's try to reference exact brand if indexed,
        // but safe fallback is fetch relevant ones.
        const snapshot = await paintsRef.where('brand', '==', 'Liquitex Professional Acrylic Ink').get();

        // Also check for just 'Liquitex' and type 'Acrylic Ink' to be thorough? 
        // Let's stick to the brand name we use: 'Liquitex Professional Acrylic Ink'

        console.log(`[Update Liquitex] Found ${snapshot.size} existing Liquitex Inks to delete`);

        // Batch delete
        const batchSize = 500;
        let batch = db.batch();
        let operationCount = 0;
        let deletedCount = 0;

        const existingDocs = snapshot.docs;
        for (const doc of existingDocs) {
            batch.delete(doc.ref);
            operationCount++;
            deletedCount++;

            if (operationCount >= batchSize) {
                await batch.commit();
                batch = db.batch();
                operationCount = 0;
            }
        }
        if (operationCount > 0) {
            await batch.commit();
        }

        console.log(`[Update Liquitex] Deleted ${deletedCount} old paints`);

        // Batch add new paints
        batch = db.batch();
        operationCount = 0;
        let addedCount = 0;

        for (const paint of scrapeResult.paints) {
            const newDocRef = paintsRef.doc();
            const paintData = {
                paintId: newDocRef.id,
                name: paint.name,
                brand: paint.brand,
                type: paint.type,
                hexColor: paint.hexColor,
                // Add metadata if needed
                scrapedAt: new Date(),
                sourceUrl: paint.sourceUrl,
                swatchUrl: paint.swatchUrl
            };

            batch.set(newDocRef, paintData);
            operationCount++;
            addedCount++;

            if (operationCount >= batchSize) {
                await batch.commit();
                batch = db.batch();
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        console.log(`[Update Liquitex] Added ${addedCount} new paints`);

        return NextResponse.json({
            success: true,
            message: `Successfully updated Liquitex Inks`,
            deleted: deletedCount,
            added: addedCount,
            samplePaints: scrapeResult.paints.slice(0, 5).map(p => p.name),
        });

    } catch (error: any) {
        console.error('[Update Liquitex] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to update Liquitex paints',
                details: error.stack,
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Liquitex Paint Update Endpoint',
        instructions: 'Send a POST request to scrape and update Liquitex Professional Acrylic Inks',
        endpoint: '/api/admin/update-liquitex-paints',
    });
}
