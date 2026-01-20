
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { createOneMinClient } from '@/lib/ai/onemin-client';
import { getAdminApp } from '@/lib/firebase/admin';


export async function POST(request: NextRequest) {
    getAdminApp();
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        await getAuth().verifyIdToken(token);

        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        const oneMin = createOneMinClient();
        if (!oneMin) {
            return NextResponse.json({ error: 'AI Client not configured' }, { status: 500 });
        }

        // Fetch the image and convert to base64
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) throw new Error('Failed to fetch image');
        const buffer = await imageRes.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        const mediaType = imageRes.headers.get('content-type') || 'image/jpeg';

        const prompt = `
        Act as a professional miniature painting judge (Golden Demon standard). 
        Analyze the painting quality of this miniature. Focus on:
        1. Technical application (smoothness, thinning, brush control)
        2. Contrast (volumes, shadows, highlights)
        3. Advanced techniques (NMM, OSL, Weathering, Blending)
        4. Color choice and harmony.
        
        Provide the result strictly as a valid JSON object with this schema:
        {
            "grade": "Beginner" | "Tabletop Ready" | "Tabletop Plus" | "Display Standard" | "Competition Level",
            "score": number, // 1-100
            "analysis": "Short summary (max 2 sentences)",
            "technical_strengths": ["string", "string"],
            "improvements": ["string", "string"],
            "colors": "Comment on usage of colors"
        }
        Do not include markdown formatting or code blocks. Just the raw JSON.
        `;

        const result = await oneMin.chatWithImage({
            model: 'gpt-4o', // Best for vision
            prompt,
            imageBase64: base64Image,
            imageMediaType: mediaType,
            maxTokens: 1000
        });

        // Clean up result if it comes with markdown
        let cleanResult = result.trim();
        if (cleanResult.startsWith('```json')) {
            cleanResult = cleanResult.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        const jsonResult = JSON.parse(cleanResult);

        return NextResponse.json(jsonResult);

    } catch (error: any) {
        console.error('AI Analysis Failed:', error);
        return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
    }
}
