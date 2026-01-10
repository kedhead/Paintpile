
import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/ai/anthropic-client';
import { getAllPaints } from '@/lib/firestore/paints';
import { Paint } from '@/types/paint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ImportRequest {
    description: string;
    brand?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ImportRequest = await request.json();
        const { description } = body;

        if (!description || description.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Description is required' },
                { status: 400 }
            );
        }

        // Fetch all paints to provide context
        const allPaints = await getAllPaints();

        let targetPaints = allPaints;

        // STRICT OVERRIDE: If user manually selected a brand, enforce it
        if (body.brand) {
            const filterBrand = body.brand;
            console.log(`[AI Import] Applying strict brand filter: ${filterBrand}`);

            // Robust check: Remove EVERYTHING except letters and numbers
            const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedFilter = normalize(filterBrand);

            targetPaints = allPaints.filter(p => {
                const normalizedPaintBrand = normalize(p.brand);
                return normalizedPaintBrand.includes(normalizedFilter);
            });
        }

        if (targetPaints.length === 0) {
            const allBrands = Array.from(new Set(allPaints.map(p => p.brand)));
            console.log(`[AI Import] Filter '${body.brand}' resulted in 0 paints. Available brands:`, allBrands);

            return NextResponse.json({
                paints: [],
                matchedCount: 0,
                debugInfo: {
                    message: `Filter '${body.brand}' found 0 paints.`,
                    totalPaintsInDb: allPaints.length,
                    availableBrands: allBrands.slice(0, 10)
                }
            });
        }

        // Call Claude to recall paint sets (Pure Recall)
        const anthropicClient = getAnthropicClient();
        const { paints: recalledItems, rawOutput } = await anthropicClient.expandPaintSet(
            description
        );

        console.log(`[AI Import] Claude recalled ${recalledItems.length} items`);

        // Match names back to full Paint objects
        const matchedPaints: Paint[] = [];
        const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        for (const item of recalledItems) {
            const recalledNameNorm = normalize(item.name);
            const recalledBrandNorm = normalize(item.brand);

            const matches = targetPaints.filter(p => {
                const pNameNorm = normalize(p.name);
                const pBrandNorm = normalize(p.brand);

                // 1. Brand Check
                // If the user didn't force a brand, we should check if the AI's brand matches the DB brand
                if (!body.brand) {
                    if (!pBrandNorm.includes(recalledBrandNorm) && !recalledBrandNorm.includes(pBrandNorm)) {
                        return false;
                    }
                }

                // 2. Name Check: fuzzy matching
                return pNameNorm.includes(recalledNameNorm) || recalledNameNorm.includes(pNameNorm);
            });

            // Prioritize exact matches
            let match = matches.find(p => normalize(p.name) === recalledNameNorm);

            if (!match && matches.length > 0) {
                match = matches[0];
            }

            if (match && !matchedPaints.some(p => p.paintId === match.paintId)) {
                matchedPaints.push(match);
            }
        }

        return NextResponse.json({
            success: true,
            paints: matchedPaints,
            rawCount: recalledItems.length,
            matchedCount: matchedPaints.length,
            rawAiOutput: rawOutput
        });

    } catch (error: any) {
        console.error('AI Import failed:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process import' },
            { status: 500 }
        );
    }
}
