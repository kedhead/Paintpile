
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { PaintSet } from '@/types/paint-set';

export async function POST(request: NextRequest) {
    try {
        // TODO: Verify admin auth here (context or token)
        // For now assuming middleware or upstream check

        const body = await request.json();
        const { sets } = body as { sets: PaintSet[] };

        if (!sets || !Array.isArray(sets) || sets.length === 0) {
            return NextResponse.json({ success: false, error: 'No sets provided' }, { status: 400 });
        }

        const db = getAdminFirestore();
        const batch = db.batch();
        const collectionRef = db.collection('paint-sets');

        let addedCount = 0;

        for (const set of sets) {
            if (!set.setId || !set.brand || !set.setName) {
                console.warn('Skipping invalid set:', set);
                continue;
            }

            const docRef = collectionRef.doc(set.setId);
            batch.set(docRef, {
                ...set,
                updatedAt: new Date().toISOString(),
                isCurated: false, // Force false for scraped sets until verified
            }, { merge: true });

            addedCount++;
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: `Successfully saved ${addedCount} paint sets to database`
        });

    } catch (error: any) {
        console.error('Save Paint Set Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
