
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebase/admin';

/**
 * Tracks AI usage for a user and checks for badges.
 * Must be called from a server-side context (e.g. API route) where Admin SDK is initialized.
 * 
 * @param userId - The user ID to track usage for
 * @param feature - The specific AI feature used (e.g., 'critic', 'recipe', 'icon')
 */
export async function trackAIUsage(userId: string, feature: string) {
    if (!userId) return;

    try {
        // Ensure Admin App is initialized (idempotent)
        try {
            getAdminApp();
        } catch (e) {
            // Already initialized or handled elsewhere
        }

        const db = getFirestore();
        const userRef = db.collection('users').doc(userId);

        // Update stats
        await userRef.update({
            'stats.aiActionsUsed': FieldValue.increment(1),
            [`stats.aiUsage.${feature}`]: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
        });

        // Trigger badge check (lazy check)
        // We import the logic dynamically or duplicate necessary parts to avoid circular deps if badges.ts is client-side
        // Ideally we should move checkAndAwardBadges to a shared lib-admin or similar, 
        // but for now we can implement the check logic for these specific badges here or call a consolidated admin function.

        // Let's implement a targeted check for AI badges here to be efficient
        await checkAIBadges(userId, db);

    } catch (error) {
        console.error(`[AI Tracking] Failed to track usage for ${userId}:`, error);
        // We do NOT want to throw here, as AI feature should succeed even if tracking fails
    }
}

async function checkAIBadges(userId: string, db: FirebaseFirestore.Firestore) {
    try {
        const userSnap = await db.collection('users').doc(userId).get();
        if (!userSnap.exists) return;

        const data = userSnap.data();
        const count = data?.stats?.aiActionsUsed || 0;

        // Define milestones
        const milestones = [
            { id: 'ai_explorer', value: 1, name: 'AI Explorer' },
            { id: 'ai_enthusiast', value: 10, name: 'AI Enthusiast' },
            { id: 'ai_power_user', value: 50, name: 'AI Power User' }
        ];

        const batch = db.batch();
        let hasUpdates = false;

        for (const m of milestones) {
            if (count >= m.value) {
                // Check if already earned
                const badgeRef = db.collection('users').doc(userId).collection('earned_badges').doc(m.id);
                const badgeSnap = await badgeRef.get();

                if (!badgeSnap.exists) {
                    hasUpdates = true;
                    // Prepare badge data
                    batch.set(badgeRef, {
                        badgeId: m.id,
                        userId,
                        earnedAt: FieldValue.serverTimestamp(),
                        notificationSent: true,
                        showcased: false
                    });

                    // Increment badge count
                    const userRef = db.collection('users').doc(userId);
                    batch.update(userRef, {
                        'stats.badgeCount': FieldValue.increment(1)
                    });

                    // Send notification
                    const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
                    batch.set(notifRef, {
                        userId,
                        type: 'badge_earned',
                        actorId: 'system',
                        actorUsername: 'PaintPile',
                        targetId: m.id,
                        targetType: 'badge',
                        targetName: m.name,
                        message: `You earned the "${m.name}" badge!`,
                        actionUrl: '/badges',
                        read: false,
                        createdAt: FieldValue.serverTimestamp()
                    });

                    console.log(`[AI Tracking] Awarding ${m.id} to ${userId}`);
                }
            }
        }

        if (hasUpdates) {
            await batch.commit();
        }

    } catch (error) {
        console.error('[AI Tracking] Error checking badges:', error);
    }
}
