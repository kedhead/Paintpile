import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth/server-auth';
import { createOneMinClient } from '@/lib/ai/onemin-client';
import { getAdminStorage } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    let step = 'init';
    try {
        // 1. Verify Admin Auth
        step = 'auth_verification';
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
        step = 'ai_client_init';
        const aiClient = createOneMinClient();
        if (!aiClient) {
            console.error('[BadgeGen] MIN_API_KEY is not set');
            return NextResponse.json(
                { success: false, error: 'AI service not configured (Missing Key)' },
                { status: 503 }
            );
        }

        // 3. Generate Image
        step = 'ai_generation';
        const stylePrompt = style || 'flat vector icon, white background, simple, high contrast, minimalistic, game badge style';
        const fullPrompt = `${prompt}, ${stylePrompt}`;

        console.log('[BadgeGen] Generating icon for:', fullPrompt);

        // Optimize: Use 'dall-e-3' if 'midjourney' is failing/flakey or verify model
        // Using 'midjourney' as per original plan
        const imageUrl = await aiClient.generateImage({
            prompt: fullPrompt,
            model: 'dall-e-3',
            aspectRatio: '1:1'
        });

        if (!imageUrl) throw new Error("AI Client returned empty URL");
        console.log('[BadgeGen] Generated URL:', imageUrl);

        // 4. Download Image
        step = 'image_download';
        let imageBuffer: Buffer;
        try {
            if (imageUrl.startsWith('https://')) {
                const res = await fetch(imageUrl);
                if (!res.ok) throw new Error(`Failed to fetch generated image: ${res.status} ${res.statusText}`);
                const arrayBuffer = await res.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);
            } else {
                imageBuffer = await aiClient.downloadAsset(imageUrl);
            }
        } catch (downloadError: any) {
            console.error('[BadgeGen] Download failed:', downloadError);
            return NextResponse.json(
                { success: false, error: 'Failed to download generated image from AI provider' },
                { status: 502 }
            );
        }

        // 5. Upload to Firebase Storage
        step = 'firebase_init';
        const storage = getAdminStorage(); // Might throw if creds invalid
        const bucket = storage.bucket();

        step = 'firebase_upload';
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
