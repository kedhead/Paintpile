
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Simple .env parser since dotenv might be missing
try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
} catch (e) {
    console.log('Error reading .env.local', e);
}

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
    console.log('Fetching badges...');
    const snapshot = await db.collection('badges').get();
    if (snapshot.empty) {
        console.log('No badges found.');
        return;
    }

    const badges = [];
    snapshot.forEach(doc => {
        badges.push({ id: doc.id, ...doc.data() });
    });

    // Sort by name to find duplicates easily
    badges.sort((a, b) => a.name.localeCompare(b.name));

    console.log('--- Badges ---');
    badges.forEach(b => {
        console.log(`[${b.id}] ${b.name} (Tier: ${b.tier}, Category: ${b.category})`);
    });
    console.log(`Total: ${badges.length}`);
}

listBadges().catch(console.error);
