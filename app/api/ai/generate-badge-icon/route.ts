import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth/server-auth';
import { createOneMinClient } from '@/lib/ai/onemin-client';
import { getAdminStorage } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Admin Auth
        const auth = await verifyAuth(request);
        if (!auth) return unauthorizedResponse();
        if (!auth.isAdmin) return forbiddenResponse();

        const body = await request.json();
        const { prompt, style } = body;

        if (!prompt) {
            return NextResponse.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // 2. Initialize AI Client
        const aiClient = createOneMinClient();
        if (!aiClient) {
            return NextResponse.json(
                { success: false, error: 'AI service not configured (Missing Key)' },
                { status: 503 }
            );
        }

        // 3. Generate Image
        // Optimize prompt for icons
        const stylePrompt = style || 'flat vector icon, white background, simple, high contrast, minimalistic, game badge style';
        const fullPrompt = `${prompt}, ${stylePrompt}`;

        console.log('[BadgeGen] Generating icon for:', fullPrompt);

        // Usage: generateImage returns a URL
        const imageUrl = await aiClient.generateImage({
            prompt: fullPrompt,
            model: 'midjourney', // or 'dall-e-3' if preferred, stick to efficient ones
            aspectRatio: '1:1'
        });

        console.log('[BadgeGen] Generated URL:', imageUrl);

        // 4. Download Image
        // Use the client's download helper if available, or simple fetch
        let imageBuffer: Buffer;
        try {
            if (imageUrl.startsWith('https://')) {
                const res = await fetch(imageUrl);
                if (!res.ok) throw new Error(`Failed to fetch generated image: ${res.status}`);
                const arrayBuffer = await res.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);
            } else {
                // Should be a URL, but handle potential errors
                // Attempt to use client download helper if it's a path
                imageBuffer = await aiClient.downloadAsset(imageUrl);
            }
        } catch (downloadError) {
            console.error('[BadgeGen] Download failed:', downloadError);
            return NextResponse.json(
                { success: false, error: 'Failed to download generated image from AI provider' },
                { status: 502 }
            );
        }

        // 5. Upload to Firebase Storage
        const bucket = getAdminStorage().bucket();
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const fileName = `badges/icons/${timestamp}_${random}.png`;
        const file = bucket.file(fileName);

        await file.save(imageBuffer, {
            metadata: {
                contentType: 'image/png',
            }
        });

        await file.makePublic();
        const publicUrl = file.publicUrl();

        console.log('[BadgeGen] Uploaded to:', publicUrl);

        return NextResponse.json({
            success: true,
            url: publicUrl
        });

    } catch (error: any) {
        console.error('[BadgeGen] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
