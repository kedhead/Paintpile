
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

        // Extract just the names for Claude
        const availablePaintNames = targetPaints.map(p => p.name);

        // Call Claude to expand paint sets
        const anthropicClient = getAnthropicClient();
        const { paints: matchedNames, rawOutput } = await anthropicClient.expandPaintSet(
            description,
            availablePaintNames
        );

        console.log(`[AI Import] Claude returned ${matchedNames.length} paint names`);

        // Match names back to full Paint objects
        const matchedPaints: Paint[] = [];
        const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        for (const name of matchedNames) {
            const normalizedName = normalize(name);

            // Find in targetPaints (already brand-filtered)
            const match = targetPaints.find(p => {
                const pNameNormal = normalize(p.name);
                // Exact match or fuzzy substring
                return pNameNormal === normalizedName ||
                    pNameNormal.includes(normalizedName) ||
                    normalizedName.includes(pNameNormal);
            });

            if (match && !matchedPaints.some(p => p.paintId === match.paintId)) {
                matchedPaints.push(match);
            }
        }

        return NextResponse.json({
            success: true,
            paints: matchedPaints,
            rawCount: matchedNames.length,
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
