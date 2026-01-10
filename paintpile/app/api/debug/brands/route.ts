import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getAdminFirestore();
        const snapshot = await db.collection('paints').get();

        const brandCounts: Record<string, number> = {};
        let totalPaints = 0;

        snapshot.forEach(doc => {
            const p = doc.data();
            const b = p.brand || 'Unknown';
            brandCounts[b] = (brandCounts[b] || 0) + 1;
            totalPaints++;
        });

        return NextResponse.json({
            totalPaints,
            brands: brandCounts
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
