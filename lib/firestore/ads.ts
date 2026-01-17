import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AdSettings, DEFAULT_AD_SETTINGS } from '@/types/ads';

const SETTINGS_COLLECTION = 'site_settings';
const ADS_DOC = 'ads';

export async function getAdSettings(): Promise<AdSettings> {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, ADS_DOC);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            return snapshot.data() as AdSettings;
        }

        return DEFAULT_AD_SETTINGS;
    } catch (error) {
        console.error('Error fetching ad settings:', error);
        return DEFAULT_AD_SETTINGS;
    }
}

export async function updateAdSettings(settings: AdSettings): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, ADS_DOC);
    await setDoc(docRef, settings);
}
