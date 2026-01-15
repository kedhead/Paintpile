import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

interface MixRequestBody {
    targetColor: string; // "Warpstone Glow" or Hex
    inventory: string[]; // List of paint names ["Abaddon Black", "Moot Green"...]
}

export async function POST(request: NextRequest) {
    try {
        const body: MixRequestBody = await request.json();

        if (!body.targetColor) {
            return NextResponse.json(
                { success: false, error: 'Target color is required' },
                { status: 400 }
            );
        }

        if (!body.inventory || body.inventory.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Inventory is empty' },
                { status: 400 }
            );
        }

        // Limit inventory list to top 100 to avoid token limits if user has huge collection
        // 100 paints is plenty for mixing.
        const limitedInventory = body.inventory.slice(0, 100).join(', ');

        const prompt = `
You are an expert miniature painter and color theorist.
I want to mix a color that looks like: "${body.targetColor}".
I DO NOT have this specific paint.

I ONLY have access to the following paints in my inventory:
[${limitedInventory}]

Please suggest a mixing recipe using ONLY the paints from my inventory above to approximate "${body.targetColor}".
Format your response as follows:
1. **The Recipe**: specific ratios (e.g., 2 parts Paint A : 1 part Paint B).
2. **The Logic**: Brief explanation of why this mix works (color theory).
3. **Accuracy**: Estimate how close this match triggers (e.g. "Close Match", "Approximate", "Rough Highlight").

If it is impossible to mix a close color from my inventory, suggest the single closest alternative from my list.
Keep your response concise and helpful.
`;

        const client = getReplicateClient();
        const response = await client.generateText(prompt);

        return NextResponse.json({ success: true, recipe: response });

    } catch (error: any) {
        console.error('[Mix Paint API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate mixing recipe' },
            { status: 500 }
        );
    }
}
