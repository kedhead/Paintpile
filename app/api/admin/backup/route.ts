import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth/server-auth';
import { getAdminDb } from '@/lib/firebase/admin';

// Key collections to backup
// Excluded: 'diary_entries' (too large/private?), 'follows' (derived?)
// Included: Core data types + Social
const COLLECTIONS_TO_BACKUP = [
    'users',
    'projects',
    'armies',
    'paintRecipes',
    'paints',
    'customPaints',
    'likes',
    'comments',
    'activities',
    'badges',
    'site_settings',
    'site_news'
];

export async function GET(request: NextRequest) {
    // 1. Verify Authentication & Admin Status
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();
    if (!auth.isAdmin) return forbiddenResponse();

    try {
        const db = getAdminDb();
        const backupData: Record<string, any[]> = {};

        // 2. Fetch all data
        // Note: For very large databases, this approach (loading everything into memory) requires pagination/streams.
        // Given current scale, parallel Promise.all is acceptable but we should be mindful.
        // We'll limit per collection to prevent timeout/oom for now, or just fetch all if small.
        // Fetching 1000 docs per collection for safety in this V1.

        await Promise.all(COLLECTIONS_TO_BACKUP.map(async (collectionName) => {
            const snapshot = await db.collection(collectionName).limit(2000).get();
            backupData[collectionName] = snapshot.docs.map(doc => {
                // Convert Timestamps to ISO strings for JSON compatibility
                const data = doc.data();
                const processedData: any = { _id: doc.id, ...data };

                // Helper to serialize timestamps recursively if needed, 
                // but for now simple JSON.stringify usually handles it (though it might lose precision or formatting)
                // Let's just return raw data and let the client handle it, or JSON.stringify will convert to generic objects.

                return processedData;
            });
        }));

        // 3. Create Export Object
        const exportObject = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: backupData
        };

        // 4. Return as JSON file download
        return new NextResponse(JSON.stringify(exportObject, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="paintpile-backup-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });

    } catch (error) {
        console.error('Error creating backup:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create backup' },
            { status: 500 }
        );
    }
}
