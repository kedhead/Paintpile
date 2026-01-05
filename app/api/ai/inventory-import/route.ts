
import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { getAllPaints } from '@/lib/firestore/paints';
import { Paint } from '@/types/paint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increased timeout for larger context

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

        // Fetch all paints to provide context
        const allPaints = await getAllPaints();

        // Create a compact list of valid paints for the prompt
        // Format: "Brand: Paint Name"
        const validPaintList = allPaints
            .map(p => `"${p.brand}": "${p.name}"`)
            .join('\n');

        // 1. Construct prompt for Llama 3
        const systemPrompt = `You are an expert miniature painting assistant. 
    Your goal is to identify which paints a user owns based on their description.
    
    Here is the COMPLETE list of valid paints in our database:
    ${validPaintList}
    
    INSTRUCTIONS:
    1. Analyze the user's input to understand what they own.
    2. Map their description to the EXACT "brand" and "name" from the valid list above.
    3. If the user mentions a specific SET (e.g. "Mega Set", "Starter Set"), and you don't know the exact contents, YOU MUST INFER it by selecting a representative collection of paints from that brand (e.g. 50 paints for a Mega Set, 10 for a Starter) from the valid list. Choose a balanced variety of colors (Base, Layer, Metallic, Wash).
    4. Return ONLY a JSON array of objects with "brand" and "name". 
    5. Do not invent names that are not in the valid list. 
    
    User Input: "${description}"
    
    JSON Output:`;

        // 2. Generate text
        const textOutput = await replicateClient.generateText(systemPrompt);
        console.log("AI Output:", textOutput);

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
        const matchedPaints: Paint[] = [];

        // Simple robust matching
        for (const item of paintItems) {
            const targetName = item.name.toLowerCase();
            const targetBrand = item.brand.toLowerCase();

            // Find best match
            const match = allPaints.find(p => {
                const pName = p.name.toLowerCase();
                const pBrand = p.brand.toLowerCase();

                // Exact match preferred (and expected since we gave the list)
                if (pName === targetName && pBrand === targetBrand) return true;

                // Fuzzy match fallback
                return pName === targetName && pBrand.includes(targetBrand);
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
