import { doc, setDoc, getDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { User } from '@/types/user';

/**
 * Create a new user profile in Firestore
 */
export async function createUserProfile(
  userId: string,
  email: string,
  displayName: string
): Promise<void> {
  const userRef = doc(db, 'users', userId);

  const newUser = {
    userId,
    email,
    displayName,
    username: '',
    bio: '',
    photoURL: '',
    createdAt: serverTimestamp(),
    settings: {
      publicProfile: true,
      showPileStats: true,
    },
    stats: {
      projectCount: 0,
      photoCount: 0,
      pileCount: 0,
      paintCount: 0,
    },
  };

  await setDoc(userRef, newUser);
}

/**
 * Get a user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as User;
  }

  return null;
}

/**
 * Update a user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
}

/**
 * Increment user stats
 */
export async function incrementUserStats(
  userId: string,
  field: 'projectCount' | 'photoCount' | 'pileCount' | 'paintCount',
  value: number = 1
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    [`stats.${field}`]: increment(value),
  });
}
