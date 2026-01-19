
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp, isUserAdmin } from '@/lib/firebase/admin';


export async function POST(request: NextRequest) {
    getAdminApp();
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // Strict Admin Check
        const isAdmin = await isUserAdmin(uid);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const backupData = await request.json();

        // Validate structure
        if (!backupData.data || !backupData.timestamp) {
            return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
        }

        const db = getFirestore();
        const batchSize = 500;
        let batch = db.batch();
        let operationCount = 0;
        let totalRestored = 0;

        // Iterate over collections in the backup
        for (const [collectionName, documents] of Object.entries(backupData.data)) {
            if (typeof documents !== 'object') continue;

            const docs = documents as Record<string, any>;

            for (const [docId, docData] of Object.entries(docs)) {
                const docRef = db.collection(collectionName).doc(docId);

                // Use merge: true to update existing or create new without wiping fields not in backup (unless desired, but merge is safer)
                batch.set(docRef, docData, { merge: true });
                operationCount++;
                totalRestored++;

                if (operationCount >= batchSize) {
                    await batch.commit();
                    batch = db.batch();
                    operationCount = 0;
                }
            }
        }

        // Commit remaining
        if (operationCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            message: `Successfully restored ${totalRestored} documents across ${Object.keys(backupData.data).length} collections.`
        });

    } catch (error: any) {
        console.error('Restore Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
