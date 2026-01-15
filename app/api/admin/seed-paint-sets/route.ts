
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { CURATED_PAINT_SETS } from '@/lib/data/paint-sets';

export async function GET() {
    return POST();
}

export async function POST() {
    try {
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
