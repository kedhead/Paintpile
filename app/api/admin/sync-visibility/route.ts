import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/lib/auth/server-auth';

export async function POST(req: NextRequest) {
    try {
        // Verify admin access
        const auth = await verifyAuth(req);
        if (!auth?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminDb = getAdminDb();
        const batch = adminDb.batch();
        let updateCount = 0;

        // 1. Sync Project Visibility
        const projectsSnapshot = await adminDb.collection('projects')
            .where('isPublic', '==', true)
            .get();

        console.log(`Found ${projectsSnapshot.size} public projects to sync`);

        for (const projectDoc of projectsSnapshot.docs) {
            const projectId = projectDoc.id;

            const activitySnapshot = await adminDb.collection('activities')
                .where('type', '==', 'project_created')
                .where('targetId', '==', projectId)
                .limit(1)
                .get();

            if (!activitySnapshot.empty) {
                const activityDoc = activitySnapshot.docs[0];
                const activityData = activityDoc.data();

                if (activityData.metadata?.visibility !== 'public') {
                    batch.update(activityDoc.ref, {
                        'metadata.visibility': 'public'
                    });
                    updateCount++;
                }
            }
        }

        // 2. Sync Army Visibility
        const armiesSnapshot = await adminDb.collection('armies')
            .where('isPublic', '==', true)
            .get();

        console.log(`Found ${armiesSnapshot.size} public armies to sync`);

        for (const armyDoc of armiesSnapshot.docs) {
            const armyId = armyDoc.id;

            const activitySnapshot = await adminDb.collection('activities')
                .where('type', '==', 'army_created')
                .where('targetId', '==', armyId)
                .limit(1)
                .get();

            if (!activitySnapshot.empty) {
                const activityDoc = activitySnapshot.docs[0];
                const activityData = activityDoc.data();

                if (activityData.metadata?.visibility !== 'public') {
                    batch.update(activityDoc.ref, {
                        'metadata.visibility': 'public'
                    });
                    updateCount++;
                }
            }
        }

        if (updateCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            message: `Synced visibility for ${updateCount} activities`
        });
    } catch (error) {
        console.error('Error syncing visibility:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
