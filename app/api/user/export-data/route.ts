
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebase/admin';


export async function GET(request: NextRequest) {
    getAdminApp(); // Initialize only when request is handled
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const db = getFirestore();

        // parallel fetch of all user data
        const [
            userDoc,
            projectsSnap,
            armiesSnap,
            recipesSnap,
            diarySnap,
            paintsSnap,
            wishlistSnap
        ] = await Promise.all([
            db.collection('users').doc(uid).get(),
            db.collection('projects').where('authorId', '==', uid).get(),
            db.collection('armies').where('authorId', '==', uid).get(),
            db.collection('recipes').where('authorId', '==', uid).get(),
            db.collection('users').doc(uid).collection('diary_entries').get(),
            db.collection('users').doc(uid).collection('paints').get(),
            db.collection('users').doc(uid).collection('wishlist').get()
        ]);

        const userData = {
            profile: userDoc.data() || {},
            projects: projectsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            armies: armiesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            recipes: recipesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            diary_entries: diarySnap.docs.map(d => ({ id: d.id, ...d.data() })),
            inventory: paintsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            wishlist: wishlistSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        return new NextResponse(JSON.stringify(userData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="user-data-${uid}-${Date.now()}.json"`
            }
        });

    } catch (error: any) {
        console.error('Export Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
