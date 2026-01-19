
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccountVal = process.env.FIREBASE_ADMIN_CREDENTIALS;
if (!serviceAccountVal) {
    console.error('FIREBASE_ADMIN_CREDENTIALS not set');
    process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountVal);

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function listBadges() {
    const snapshot = await db.collection('badges').get();
    if (snapshot.empty) {
        console.log('No badges found.');
        return;
    }

    console.log('--- Badges ---');
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`[${doc.id}] ${data.name} (Tier: ${data.tier})`);
    });
    console.log('--------------');
}

listBadges().catch(console.error);
