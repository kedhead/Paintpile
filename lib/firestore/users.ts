import { doc, setDoc, getDoc, updateDoc, serverTimestamp, increment, collection, query, where, getDocs, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { User } from '@/types/user';
import { Project } from '@/types/project';

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
    lastLoginAt: serverTimestamp(),
    settings: {
      publicProfile: true,
      showPileStats: true,
    },
    stats: {
      projectCount: 0,
      // ... existing stats truncated ...
      commentsReceived: 0,
    },
  };

  await setDoc(userRef, newUser);
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    lastLoginAt: serverTimestamp(),
  });
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
  field: 'projectCount' | 'photoCount' | 'pileCount' | 'paintCount' | 'armyCount' | 'likesReceived' | 'recipesCreated' | 'badgeCount' | 'commentCount' | 'commentsReceived',
  value: number = 1
): Promise<void> {
  const userRef = doc(db, 'users', userId);

  // Check if user profile exists
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.warn(`User profile not found for userId: ${userId}. Creating minimal profile.`);
    // Create a minimal user profile if it doesn't exist
    // This can happen if profile creation failed during signup
    await setDoc(userRef, {
      userId,
      email: '',
      displayName: 'User',
      username: '',
      bio: '',
      photoURL: '',
      createdAt: serverTimestamp(),
      settings: {
        publicProfile: true,
        showPileStats: true,
      },
      stats: {
        projectCount: field === 'projectCount' ? value : 0,
        photoCount: field === 'photoCount' ? value : 0,
        pileCount: field === 'pileCount' ? value : 0,
        paintCount: field === 'paintCount' ? value : 0,
        followerCount: 0,
        followingCount: 0,
        armyCount: field === 'armyCount' ? value : 0,
        likesReceived: field === 'likesReceived' ? value : 0,
        recipesCreated: field === 'recipesCreated' ? value : 0,
        badgeCount: field === 'badgeCount' ? value : 0,
        commentCount: field === 'commentCount' ? value : 0,
        commentsReceived: field === 'commentsReceived' ? value : 0,
      },
    });
    return;
  }

  // Profile exists, update the stats
  await updateDoc(userRef, {
    [`stats.${field}`]: increment(value),
  });
}

/**
 * Get a user by their username (case-insensitive)
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('usernameLower', '==', username.toLowerCase())
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  // Return the first matching user (should only be one due to uniqueness)
  return querySnapshot.docs[0].data() as User;
}

/**
 * Get all public projects for a specific user
 */
export async function getUserPublicProjects(userId: string): Promise<Project[]> {
  const projectsRef = collection(db, 'projects');
  const q = query(
    projectsRef,
    where('userId', '==', userId),
    where('isPublic', '==', true),
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Project);
}

/**
 * Delete a user account and all associated data
 * Note: This only deletes Firestore data. Firebase Auth user must be deleted separately.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  console.log('[deleteUserAccount] Starting deletion for user:', userId);

  // Delete user document
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);

  console.log('[deleteUserAccount] User document deleted');

  // Note: We're doing a simple deletion here.
  // In a production app, you'd want to delete all user's projects, photos, recipes, etc.
  // Or use Firebase Cloud Functions to handle cascading deletes on the backend.
  // For now, orphaned data will remain but won't be accessible without the user account.
}

/**
 * Recalculate and sync user stats based on actual collection counts.
 * Useful for fixing drifted stats or retroactive badge awarding.
 */
export async function syncUserStats(userId: string): Promise<void> {
  try {
    const { getCountFromServer } = await import('firebase/firestore');

    // 1. Count Projects
    const projectsRef = collection(db, 'projects');
    const projectsQuery = query(projectsRef, where('userId', '==', userId));
    const projectsSnap = await getCountFromServer(projectsQuery);
    const projectCount = projectsSnap.data().count;

    // 2. Count Armies
    const armiesRef = collection(db, 'armies');
    const armiesQuery = query(armiesRef, where('userId', '==', userId));
    const armiesSnap = await getCountFromServer(armiesQuery);
    const armyCount = armiesSnap.data().count;

    // 3. Count Recipes
    const recipesRef = collection(db, 'paintRecipes');
    const recipesQuery = query(recipesRef, where('userId', '==', userId));
    const recipesSnap = await getCountFromServer(recipesQuery);
    const recipesCreated = recipesSnap.data().count;

    // 4. Update User Stats
    // We only update the counts we can easily verify. 
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'stats.projectCount': projectCount,
      'stats.armyCount': armyCount,
      'stats.recipesCreated': recipesCreated,
    });

    console.log(`Synced stats for user ${userId}: P=${projectCount}, A=${armyCount}, R=${recipesCreated}`);

  } catch (error) {
    console.error('Error syncing user stats:', error);
    throw error;
  }
}
