
import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { getAllPaints } from '@/lib/firestore/paints';
import { Paint } from '@/types/paint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increased timeout for larger context

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

        const replicateClient = getReplicateClient();

        // Fetch all paints to provide context
        const allPaints = await getAllPaints();

        // Smart Context Filtering (RAG-lite)
        // 1. Identify all unique brands from database
        const allBrands = Array.from(new Set(allPaints.map(p => p.brand)));

        // 2. Check which brands are mentioned in user description
        const userDescLower = description.toLowerCase();

        // Helper to check if brand is mentioned
        const isBrandMentioned = (brand: string) => {
            const brandParts = brand.toLowerCase().split(' ');
            // Check if any significant part of the brand name is in description
            // e.g. "Army Painter" matched by "Army" or "Painter" might be too loose, 
            // but "Army Painter" is good.
            // Let's use simple inclusion for full brand name or strict sub-parts
            return userDescLower.includes(brand.toLowerCase()) ||
                (brandParts.length > 1 && brandParts.some(p => p.length > 3 && userDescLower.includes(p)));
        };

        const mentionedBrands = allBrands.filter(isBrandMentioned);

        let targetPaints = allPaints;

        if (mentionedBrands.length > 0) {
            console.log("Detected brands:", mentionedBrands);
            targetPaints = allPaints.filter(p => mentionedBrands.includes(p.brand));
        } else {
            // Fallback: Use popular brands if none detected
            const defaultBrands = ['Citadel', 'Army Painter', 'Vallejo'];
            targetPaints = allPaints.filter(p => defaultBrands.some(db => p.brand.includes(db)));
        }

        // STRICT OVERRIDE: If user manually selected a brand, enforce it
        if (body.brand) {
            const filterBrand = body.brand;
            console.log(`[AI Import] Applying strict brand filter: ${filterBrand}`);

            // Robust check: Remove EVERYTHING except letters and numbers to handle "Army_Painter", "Army-Painter", "The Army Painter"
            // This treats "Army_Painter" and "Army Painter" as "armypainter"
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedFilter = normalize(filterBrand);

            targetPaints = allPaints.filter(p => {
                const normalizedPaintBrand = normalize(p.brand);
                return normalizedPaintBrand.includes(normalizedFilter);
            });
        }

        // Create a compact list of valid paints for the prompt
        // Smart/Relevance Sorting before slicing
        const keywords = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);

        targetPaints.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            const aStr = `${a.name} ${(a as any).category || ''} ${a.type}`.toLowerCase();
            const bStr = `${b.name} ${(b as any).category || ''} ${b.type}`.toLowerCase();

            // Boost score if paint string contains user keywords
            keywords.forEach(kw => {
                if (aStr.includes(kw)) scoreA += 1;
                if (bStr.includes(kw)) scoreB += 1;
            });

            return scoreB - scoreA; // Descending order
        });

        // Format: "Brand: Paint Name"
        // Limit to 600 paints to keep prompt size safe (increased slightly)
        const validPaintList = targetPaints
            .map(p => `"${p.brand}": "${p.name}"`)
            .slice(0, 600)
            .join('\n');

        if (targetPaints.length === 0) {
            // Debugging: Why is it empty?
            const allBrands = Array.from(new Set(allPaints.map(p => p.brand)));
            console.log(`[AI Import] Filter '${body.brand}' resulted in 0 paints. Available brands:`, allBrands);

            return NextResponse.json({
                paints: [],
                matchedCount: 0,
                debugInfo: {
                    message: `Filter '${body.brand}' found 0 paints.`,
                    totalPaintsInDb: allPaints.length,
                    availableBrands: allBrands.slice(0, 10) // Show top 10 brands
                }
            });
        }
        // 1. Construct prompt for Llama 3
        const systemPrompt = `You are an expert miniature painting assistant. 
    Your goal is to identify which paints a user owns based on their description.
    
    Here is a list of RELEVANT paints from our database (filtered by context):
    ${validPaintList}
    
    INSTRUCTIONS:
    1. Analyze the user's input to understand what they own.
    2. Map their description to the EXACT "brand" and "name" from the valid list above.
    3. If the user mentions a specific SET (e.g. "Mega Set"), and the individual paints are in the list above, select a representative collection of them (e.g. 50 paints for a Mega Set).
    4. If the user mentions a brand NOT in the list above, do your best to guess standard color names for that brand.
    5. Return ONLY a JSON array of objects with "brand" and "name". 
    
    User Input: "${description}"
    
    JSON Output:`;

        // 2. Generate text
        const textOutput = await replicateClient.generateText(systemPrompt);
        console.log("AI Output (First 100 chars):", textOutput.substring(0, 100));

        // 3. Parse JSON
        let paintItems: { brand: string; name: string }[] = [];
        try {
            // Strategy A: Try to find a JSON array within the text
            // Look for first '[' and last ']'
            const firstBracket = textOutput.indexOf('[');
            const lastBracket = textOutput.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                const potentialJson = textOutput.substring(firstBracket, lastBracket + 1);
                paintItems = JSON.parse(potentialJson);
            } else {
                // Strategy B: No array brackets found, try cleaning and parsing the whole string
                const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
                paintItems = JSON.parse(cleanJson);
            }
        } catch (e) {
            console.warn('JSON parse strategy A/B failed, trying regex fallback. Error:', e);
            console.log('Raw text output was:', textOutput);

            // Strategy C: Regex fallback - looser pattern to capture objects
            // Matches { ... "brand": "...", ... "name": "..." ... }
            const matches = textOutput.match(/\{[^{}]*"brand"[^{}]*"name"[^{}]*\}/g);

            if (matches) {
                try {
                    paintItems = matches.map(m => JSON.parse(m));
                } catch (regexErr) {
                    console.error('Regex match parsing failed', regexErr);
                    // Last ditch: try to fix common JSON errors (like missing quotes keys) - skipping for now
                }
            }

            if (paintItems.length === 0) {
                // Final check - maybe it's a list like "- Brand: Name"
                const listMatches = textOutput.matchAll(/-\s*([A-Za-z0-9 ]+):\s*([A-Za-z0-9 ]+)/g);
                for (const match of listMatches) {
                    if (match[1] && match[2]) {
                        paintItems.push({ brand: match[1].trim(), name: match[2].trim() });
                    }
                }
            }

            if (paintItems.length === 0) {
                throw new Error(`Could not parse paint data from AI response. Raw output: ${textOutput.substring(0, 200)}...`);
            }
        }

        // 4. Match against database (using FULL database for matching, not just filtered context)
        const matchedPaints: Paint[] = [];

        for (const item of paintItems) {
            const targetName = item.name.toLowerCase();
            const targetBrand = item.brand.toLowerCase();

            // Find best match in FULL list
            const match = allPaints.find(p => {
                const pName = p.name.toLowerCase();
                const pBrand = p.brand.toLowerCase();

                // Exact match preferred
                if (pName === targetName && pBrand === targetBrand) return true;

                // Fuzzy match fallback
                return pName === targetName && pBrand.includes(targetBrand);
            });

            if (match) {
                if (!matchedPaints.some(p => p.paintId === match.paintId)) {
                    matchedPaints.push(match);
                }
            }
        }

        return NextResponse.json({
            success: true,
            paints: matchedPaints,
            rawCount: paintItems.length,
            matchedCount: matchedPaints.length
        });

    } catch (error: any) {
        console.error('AI Import failed:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process import' },
            { status: 500 }
        );
    }
}
