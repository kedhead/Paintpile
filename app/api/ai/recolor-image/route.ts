
import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/ai/replicate-client';
import { trackUsage, checkQuota } from '@/lib/ai/usage-tracker';
import { OPERATION_COSTS } from '@/lib/ai/constants';
import { getAdminStorage } from '@/lib/firebase/admin';
import sharp from 'sharp';

// Force dynamic to avoid static generation
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { photoId, projectId, userId, imageUrl, prompt } = await req.json();

        if (!photoId || !projectId || !userId || !imageUrl || !prompt) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 1. Check user quota
        const { allowed, reason } = await checkQuota(
            userId,
            OPERATION_COSTS.recolor
        );

        if (!allowed) {
            return NextResponse.json(
                { success: false, error: reason || 'Insufficient credits' },
                { status: 402 } // Payment required
            );
        }

        // 2. Process image with Sharp to prevent OOM
        // We fetch the image and resize it to a max dimension of 768px
        // This ensures the AI model doesn't crash on high-res phone photos
        console.log(`[Recolor API] Fetching and resizing image: ${imageUrl}`);

        let processedImage: Buffer;
        try {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            const arrayBuffer = await imageResponse.arrayBuffer();
            const inputBuffer = Buffer.from(arrayBuffer);

            // Resize but keep aspect ratio
            processedImage = await sharp(inputBuffer)
                .resize(768, 768, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 90 }) // Convert to JPEG for consistent handling
                .toBuffer();

            console.log(`[Recolor API] Resized image size: ${Math.round(processedImage.length / 1024)}KB`);
        } catch (e: any) {
            console.error('[Recolor API] Image processing failed:', e);
            return NextResponse.json(
                { success: false, error: `Failed to process image: ${e.message}` },
                { status: 422 }
            );
        }

        // 3. Call Replicate with the resized Buffer
        const replicate = getReplicateClient();
        const result = await replicate.recolorImage(processedImage, prompt);

        // 4. Get the processed image buffer (it might be a buffer already if it was a stream)
        let imageBuffer: Buffer;
        if (result.imageBuffer) {
            imageBuffer = result.imageBuffer;
        } else if (result.outputUrl) {
            imageBuffer = await replicate.downloadImage(result.outputUrl);
        } else {
            throw new Error('No image data or URL returned from Replicate');
        }

        // 5. Upload processed image to Firebase Storage
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        const storagePath = `users/${userId}/projects/${projectId}/photos/${photoId}/ai/${photoId}_recolored_${Date.now()}.jpg`;
        const file = bucket.file(storagePath);

        await file.save(imageBuffer, {
            contentType: 'image/jpeg',
            metadata: {
                contentType: 'image/jpeg',
            },
        });

        // Make the file publicly readable
        await file.makePublic();

        // Get public URL
        const processedUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

        // 6. Track usage (credits deducted)
        await trackUsage(userId, 'recolor', OPERATION_COSTS.recolor);

        return NextResponse.json({
            success: true,
            data: {
                processedUrl: processedUrl,
            },
        });

    } catch (error: any) {
        console.error('Recolor API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
