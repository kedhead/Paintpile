import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth/server-auth';
import { getAdminDb } from '@/lib/firebase/admin';

// Collections to backup
const COLLECTIONS = [
    'users',
    'projects',
    'armies',
    'paintRecipes',
    'paints', // Custom paints
    'badges',
    'diary_entries',
    'news',
    'challenges',
    'site_settings'
];

export async function GET(request: NextRequest) {
    try {
        // 1. Verify Admin Auth
        const auth = await verifyAuth(request);
        if (!auth) return unauthorizedResponse();
        if (!auth.isAdmin) return forbiddenResponse();

        const db = getAdminDb();
        const backupData: Record<string, any> = {};

        // Metadata
        backupData.metadata = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            exportedBy: auth.uid,
            environment: process.env.NODE_ENV
        };

        // 2. Fetch Data from all collections
        // We use Promise.all to fetch concurrently
        await Promise.all(COLLECTIONS.map(async (collectionName) => {
            try {
                const snapshot = await db.collection(collectionName).get();
                if (snapshot.empty) {
                    backupData[collectionName] = [];
                } else {
                    backupData[collectionName] = snapshot.docs.map(doc => ({
                        _id: doc.id,
                        ...doc.data()
                    }));
                }
            } catch (err) {
                console.error(`Error backing up collection ${collectionName}:`, err);
                backupData[collectionName] = { error: 'Failed to fetch' };
            }
        }));

        // 3. Return as JSON file
        const jsonString = JSON.stringify(backupData, null, 2);
        const filename = `paintpile-backup-${new Date().toISOString().slice(0, 10)}.json`;

        return new NextResponse(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error('Backup failed:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
