import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createOneMinClient } from '@/lib/ai/onemin-client';
import { getAdminApp } from '@/lib/firebase/admin';
import { trackAIUsage } from '@/lib/ai/tracking';

export async function POST(request: NextRequest) {
    getAdminApp();
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // Support both legacy single image and new multi-image format
        const body = await request.json();
        const { imageUrl, images } = body;

        // Normalize to array of objects { url, label? }
        const inputImages: Array<{ url: string; label?: string }> = [];

        if (images && Array.isArray(images) && images.length > 0) {
            inputImages.push(...images);
        } else if (imageUrl) {
            inputImages.push({ url: imageUrl, label: 'Main View' });
        }

        if (inputImages.length === 0) {
            return NextResponse.json({ error: 'Image URL(s) required' }, { status: 400 });
        }

        const oneMin = createOneMinClient();
        if (!oneMin) {
            return NextResponse.json({ error: 'AI Client not configured' }, { status: 500 });
        }

        // Fetch and convert all images to base64
        console.log(`[AI Critic] Processing ${inputImages.length} images for user ${userId}`);

        const processedImages: Array<{ base64: string; mediaType: string }> = [];

        await Promise.all(inputImages.map(async (img) => {
            const imageRes = await fetch(img.url);
            if (!imageRes.ok) throw new Error(`Failed to fetch image: ${img.url}`);
            const buffer = await imageRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mediaType = imageRes.headers.get('content-type') || 'image/jpeg';
            processedImages.push({ base64, mediaType });
        }));

        // Construct dynamic prompt based on inputs
        let contextDescription = "";
        if (inputImages.length > 1) {
            contextDescription = "You are provided with multiple angles of the SAME miniature. Use them to form a complete opinion of the paint job consistency.\n";
            inputImages.forEach((img, idx) => {
                if (img.label) {
                    contextDescription += `- Image ${idx + 1}: ${img.label}\n`;
                }
            });
        }

        const prompt = `
        Act as a strict and critical miniature painting judge (Golden Demon standard). 
        ${contextDescription}
        Analyze the painting quality of this miniature. Be honest and critical; do not sugarcoat issues.
        
        CRITICAL CHECKLIST:
        - BASING: Is the base painted and finished? If not, the grade cannot be higher than "Beginner".
        - MOLD LINES: Are there visible mold lines? (Be careful not to mistake sharp highlights or texture for mold lines. Only flag if obvious.)
        - COVERAGE: Is primer showing through?
        
        Analyze:
        1. Technical application (smoothness, thinning, brush control)
        2. Contrast (volumes, shadows, highlights)
        3. Advanced techniques (NMM, OSL, Weathering, Blending)
        4. Color choice and harmony.
        5. Consistency across angles (if multiple provided).
        
        Provide the result strictly as a valid JSON object with this schema:
        {
            "grade": "Beginner" | "Tabletop Ready" | "Tabletop Plus" | "Display Standard" | "Competition Level",
            "score": number, // 1-100. Be strict. 50 is average tabletop.
            "analysis": "Short summary (max 2 sentences). Mention if base is unfinished.",
            "technical_strengths": ["string", "string"],
            "improvements": ["string", "string"],
            "colors": "Comment on usage of colors"
        }
        Do not include markdown formatting or code blocks. Just the raw JSON.
        `;

        const result = await oneMin.chatWithImage({
            model: 'gpt-4o',
            prompt,
            images: processedImages,
            maxTokens: 1000
        });

        // Clean up result if it comes with markdown
        let cleanResult = result.trim();
        if (cleanResult.startsWith('```json')) {
            cleanResult = cleanResult.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        const jsonResult = JSON.parse(cleanResult);

        // --- AWARD BADGE LOGIC ---
        try {
            const db = getFirestore();
            const badgeId = 'ai_critic_user';
            const userBadgeRef = db.collection('users').doc(userId).collection('earned_badges').doc(badgeId);
            const userBadgeSnap = await userBadgeRef.get();

            if (!userBadgeSnap.exists) {
                const badgeRef = db.collection('badges').doc(badgeId);
                const badgeSnap = await badgeRef.get();
                const badgeName = badgeSnap.exists ? badgeSnap.data()?.name : 'Brave Soul';

                const batch = db.batch();

                // 1. Create earned badge
                batch.set(userBadgeRef, {
                    badgeId,
                    userId,
                    earnedAt: FieldValue.serverTimestamp(),
                    notificationSent: true,
                    showcased: false
                });

                // 2. Increment user stats
                const userRef = db.collection('users').doc(userId);
                batch.update(userRef, {
                    'stats.badgeCount': FieldValue.increment(1)
                });

                // 3. Create Notification
                const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
                batch.set(notificationRef, {
                    userId,
                    type: 'badge_earned',
                    actorId: 'system',
                    actorUsername: 'PaintPile',
                    targetId: badgeId,
                    targetType: 'badge',
                    targetName: badgeName,
                    message: `You earned the "${badgeName}" badge!`,
                    actionUrl: '/badges',
                    read: false,
                    createdAt: FieldValue.serverTimestamp()
                });

                await batch.commit();
                console.log(`[AI Critic] Awarded badge ${badgeId} to user ${userId}`);
            }
        } catch (badgeError) {
            console.error('[AI Critic] Failed to award badge:', badgeError);
            // Don't fail the whole request if badge awarding fails
        }
        // -------------------------

        // --- TRACK USAGE ---
        await trackAIUsage(userId, 'critic');
        // -------------------

        return NextResponse.json(jsonResult);

    } catch (error: any) {
        console.error('AI Analysis Failed:', error);
        return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
    }
}
