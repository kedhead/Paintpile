
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { CURATED_PAINT_SETS } from '@/lib/data/paint-sets';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
    return POST(request);
}

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) return unauthorizedResponse();
        if (!auth.isAdmin) return forbiddenResponse();

        const db = getAdminFirestore();
        const batch = db.batch();
        const collectionRef = db.collection('paint-sets');

        let count = 0;
        for (const set of CURATED_PAINT_SETS) {
            const docRef = collectionRef.doc(set.setId);
            batch.set(docRef, { ...set, updatedAt: new Date().toISOString() }, { merge: true });
            count++;
        }

        await batch.commit();

        return NextResponse.json({ success: true, message: `Seeded ${count} paint sets` });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
