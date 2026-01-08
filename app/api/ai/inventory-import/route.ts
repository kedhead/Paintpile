
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
        const { paints: recalledNames, rawOutput } = await anthropicClient.expandPaintSet(
            description
        );

        console.log(`[AI Import] Claude recalled ${recalledNames.length} paint names`);

        // Match names back to full Paint objects
        const matchedPaints: Paint[] = [];
        const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        for (const recalledName of recalledNames) {
            const normalizedRecalled = normalize(recalledName);

            // Find best match in targetPaints (already brand-filtered)
            // We want to find the DB paint that BEST matches the recalled name
            // Strategy: Check if DB name includes recalled name OR recalled name includes DB name
            const matches = targetPaints.filter(p => {
                const pNameNormal = normalize(p.name);
                return pNameNormal.includes(normalizedRecalled) || normalizedRecalled.includes(pNameNormal);
            });

            // If multiple matches, maybe pick the shortest one (usually the base paint) or the one that is closest in length?
            // For now, let's just take the first one or add all plausible matches? 
            // Better to add the exact match if possible.

            // Let's refine:
            // 1. Exact match (normalized)
            let match = matches.find(p => normalize(p.name) === normalizedRecalled);

            // 2. If no exact match, take the first fuzzy match
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
            rawCount: recalledNames.length,
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
