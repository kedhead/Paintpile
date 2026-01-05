
import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { COMPREHENSIVE_PAINTS } from '@/lib/data/comprehensive-paints';
import { getAllPaints } from '@/lib/firestore/paints';
import { Paint } from '@/types/paint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface ImportRequest {
    description: string;
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

        // 1. Construct prompt for Llama 3
        const systemPrompt = `You are a helpful assistant that identifies miniature paints from text descriptions. 
    Extract the paint brand and name from the user's input.
    If the user mentions a specific set (e.g. "Army Painter Speedpaint 2.0 set"), list the likely paints in that set.
    Return ONLY a JSON array of objects with "brand" and "name" properties. 
    Do not include any other text, markdown formatting, or explanations.
    Example input: "I have the Citadel base paint set and Vallejo Game Color starter"
    Example output: [{"brand": "Citadel", "name": "Abaddon Black"}, {"brand": "Citadel", "name": "Mephiston Red"}, {"brand": "Vallejo Game Color", "name": "Black"}]
    `;

        const fullPrompt = `${systemPrompt}\n\nUser Input: "${description}"\n\nJSON Output:`;

        // 2. Generate text
        const textOutput = await replicateClient.generateText(fullPrompt);

        // 3. Parse JSON
        let paintItems: { brand: string; name: string }[] = [];
        try {
            // Clean up potential markdown code blocks
            const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
            paintItems = JSON.parse(cleanJson);
        } catch (e) {
            console.error('Failed to parse AI output as JSON:', textOutput);
            // Fallback: Try regex to extract objects if full JSON parse fails
            const matches = textOutput.match(/\{"brand":\s*"[^"]+",\s*"name":\s*"[^"]+"\}/g);
            if (matches) {
                paintItems = matches.map(m => JSON.parse(m));
            } else {
                throw new Error('Could not parse paint data from AI response');
            }
        }

        // 4. Match against database
        // We fetch global paints to ensure we have IDs
        const allPaints = await getAllPaints();
        const matchedPaints: Paint[] = [];

        // Simple robust matching
        for (const item of paintItems) {
            const targetName = item.name.toLowerCase();
            const targetBrand = item.brand.toLowerCase();

            // Find best match
            const match = allPaints.find(p => {
                const pName = p.name.toLowerCase();
                const pBrand = p.brand.toLowerCase();

                // Exact match preferred
                if (pName === targetName && pBrand.includes(targetBrand)) return true;

                // Fuzzy match name
                return pName.includes(targetName) && pBrand.includes(targetBrand);
            });

            if (match) {
                // Avoid duplicates in return
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
