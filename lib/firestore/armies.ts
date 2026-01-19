import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Army, ArmyFormData, ArmyMember } from '@/types/army';
import { Project } from '@/types/project';
import { getProject, updateProject } from './projects';
import { incrementUserStats, getUserProfile } from './users';
import { createActivity } from './activities';
import { checkAndAwardBadges } from './badges';

/**
 * Create a new army
 */
export async function createArmy(
  userId: string,
  armyData: ArmyFormData
): Promise<string> {
  const armiesRef = collection(db, 'armies');
  const newArmyRef = doc(armiesRef);
  const armyId = newArmyRef.id;

  const army: Omit<Army, 'createdAt' | 'updatedAt'> & {
    createdAt: any;
    updatedAt: any;
  } = {
    armyId,
    userId,
    name: armyData.name,
    description: armyData.description || '',
    projectIds: [],
    tags: armyData.tags || [],
    faction: armyData.faction || '',
    armySize: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isPublic: true, // Default to public
    likeCount: 0,
    commentCount: 0,
    ...(armyData.customPhotoUrl ? { customPhotoUrl: armyData.customPhotoUrl } : {}),
  };

  await setDoc(newArmyRef, army);

  // Increment user's army count
  await incrementUserStats(userId, 'armyCount', 1);

  // Get user details for activity
  const user = await getUserProfile(userId);

  if (user) {
    // Create activity entry
    try {
      await createActivity(
        userId,
        user.displayName || user.email,
        user.photoURL,
        'army_created',
        armyId,
        'army',
        {
          armyName: armyData.name,
          armyPhotoUrl: (armyData.customPhotoUrl || null) as any, // Add cover photo, avoid undefined
          visibility: 'public', // Default to public
        }
      );
    } catch (err) {
      console.error('Error creating army activity:', err);
    }

    // Check if user earned any badges
    try {
      await checkAndAwardBadges(userId);
    } catch (err) {
      console.error('Error checking badges:', err);
    }
  }

  return armyId;
}

/**
 * Get a single army by ID
 */
export async function getArmy(armyId: string): Promise<Army | null> {
  const armyRef = doc(db, 'armies', armyId);
  const armySnap = await getDoc(armyRef);

  if (armySnap.exists()) {
    return armySnap.data() as Army;
  }

  return null;
}

/**
 * Get armies for a specific user
 */
export async function getUserArmies(
  userId: string,
  options?: {
    limitCount?: number;
  }
): Promise<Army[]> {
  const armiesRef = collection(db, 'armies');

  const q = query(armiesRef, where('userId', '==', userId));

  const querySnapshot = await getDocs(q);
  let armies = querySnapshot.docs.map((doc) => doc.data() as Army);

  // Sort by updatedAt in memory to avoid needing a composite index
  armies.sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() || 0;
    const bTime = b.updatedAt?.toMillis?.() || 0;
    return bTime - aTime; // desc order
  });

  // Apply limit after sorting
  if (options?.limitCount) {
    armies = armies.slice(0, options.limitCount);
  }

  return armies;
}

/**
 * Update an army
 */
export async function updateArmy(
  armyId: string,
  updates: Partial<Army>
): Promise<void> {
  const armyRef = doc(db, 'armies', armyId);

  await updateDoc(armyRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  // If visibility or photo is changing, update the activity metadata
  if (updates.isPublic !== undefined || updates.customPhotoUrl !== undefined) {
    try {
      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('type', '==', 'army_created'),
        where('targetId', '==', armyId),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const activityDoc = snapshot.docs[0];
        const activityUpdates: any = {};

        if (updates.isPublic !== undefined) {
          activityUpdates['metadata.visibility'] = updates.isPublic ? 'public' : 'private';
        }

        if (updates.customPhotoUrl !== undefined) {
          activityUpdates['metadata.armyPhotoUrl'] = updates.customPhotoUrl || null;
        } else if (updates.isPublic === true) {
          // If becoming public but no new photo provided, grab the CURRENT existing photo
          // to ensure the feed has an image.
          const armySnap = await getDoc(armyRef);
          if (armySnap.exists()) {
            const currentArmy = armySnap.data() as Army;
            if (currentArmy.customPhotoUrl) {
              activityUpdates['metadata.armyPhotoUrl'] = currentArmy.customPhotoUrl;
            }
          }
        }

        // If becoming public, bump the createdAt timestamp so it appears at the top of feeds
        if (updates.isPublic) {
          activityUpdates.createdAt = serverTimestamp();
        }

        if (Object.keys(activityUpdates).length > 0) {
          await updateDoc(activityDoc.ref, activityUpdates);
        }
      } else {
        // SELF-HEALING: Activity not found! Create it if it should exist.
        if (updates.isPublic === true || (updates.isPublic === undefined)) {
          const armyRef = doc(db, 'armies', armyId);
          const armySnap = await getDoc(armyRef);
          if (armySnap.exists()) {
            const armyData = armySnap.data() as Army;

            // Only create if it IS public
            if (armyData.isPublic) {
              const userRef = doc(db, 'users', armyData.userId);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const userData = userSnap.data();
                await createActivity(
                  armyData.userId,
                  userData.displayName || userData.email,
                  userData.photoURL,
                  'army_created',
                  armyId,
                  'army',
                  {
                    armyName: armyData.name,
                    armyPhotoUrl: armyData.customPhotoUrl,
                    visibility: 'public'
                  }
                );
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error updating army activity visibility:', err);
    }
  }
}

/**
 * Delete an army
 * Also removes armyId from all member projects
 */
export async function deleteArmy(armyId: string, userId: string): Promise<void> {
  const army = await getArmy(armyId);

  if (!army) {
    throw new Error('Army not found');
  }

  if (army.userId !== userId) {
    throw new Error('Unauthorized to delete this army');
  }

  const batch = writeBatch(db);

  // Remove armyId from all member projects
  for (const projectId of army.projectIds) {
    const projectRef = doc(db, 'projects', projectId);
    batch.update(projectRef, {
      armyIds: arrayRemove(armyId),
      updatedAt: serverTimestamp(),
    });
  }

  // Delete all army members from subcollection
  const membersRef = collection(db, 'armies', armyId, 'members');
  const membersSnap = await getDocs(membersRef);
  membersSnap.docs.forEach((memberDoc) => {
    batch.delete(memberDoc.ref);
  });

  // Delete the army itself
  const armyRef = doc(db, 'armies', armyId);
  batch.delete(armyRef);

  // KEY FIX: Also delete the associated Feed Activity
  try {
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('type', '==', 'army_created'),
      where('targetId', '==', armyId)
    );
    const activitySnap = await getDocs(q);
    activitySnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
  } catch (err) {
    console.error('Error queuing army activity deletion:', err);
  }

  await batch.commit();

  // Decrement user's army count (if we add this stat)
  // await incrementUserStats(userId, 'armyCount', -1);
}

/**
 * Add a project to an army
 * Creates a member entry and updates both army and project
 */
export async function addProjectToArmy(
  armyId: string,
  projectId: string,
  role?: string,
  notes?: string
): Promise<void> {
  const army = await getArmy(armyId);
  const project = await getProject(projectId);

  if (!army) {
    throw new Error('Army not found');
  }

  if (!project) {
    throw new Error('Project not found');
  }

  // Check if project already in army
  if (army.projectIds.includes(projectId)) {
    throw new Error('Project already in this army');
  }

  const batch = writeBatch(db);

  // Create army member entry
  const membersRef = collection(db, 'armies', armyId, 'members');
  const memberRef = doc(membersRef, projectId); // Use projectId as memberId

  const member: any = {
    memberId: projectId,
    projectId,
    addedAt: serverTimestamp(),
  };

  // Only add role and notes if they have values
  if (role) {
    member.role = role;
  }
  if (notes) {
    member.notes = notes;
  }

  batch.set(memberRef, member);

  // Update army's projectIds array
  const armyRef = doc(db, 'armies', armyId);
  batch.update(armyRef, {
    projectIds: arrayUnion(projectId),
    updatedAt: serverTimestamp(),
  });

  // Update project's armyIds array
  const projectRef = doc(db, 'projects', projectId);
  batch.update(projectRef, {
    armyIds: arrayUnion(armyId),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  // Update army stats (recalculate total model count)
  await updateArmyStats(armyId);
}

/**
 * Remove a project from an army
 * Deletes member entry and updates both army and project
 */
export async function removeProjectFromArmy(
  armyId: string,
  projectId: string
): Promise<void> {
  const batch = writeBatch(db);

  // Delete army member entry
  const memberRef = doc(db, 'armies', armyId, 'members', projectId);
  batch.delete(memberRef);

  // Update army's projectIds array
  const armyRef = doc(db, 'armies', armyId);
  batch.update(armyRef, {
    projectIds: arrayRemove(projectId),
    updatedAt: serverTimestamp(),
  });

  // Update project's armyIds array
  const projectRef = doc(db, 'projects', projectId);
  batch.update(projectRef, {
    armyIds: arrayRemove(armyId),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  // Update army stats (recalculate total model count)
  await updateArmyStats(armyId);
}

/**
 * Get all projects in an army
 */
export async function getArmyProjects(armyId: string): Promise<Project[]> {
  const army = await getArmy(armyId);

  if (!army) {
    return [];
  }

  // Fetch all projects in the army
  const projects: Project[] = [];

  for (const projectId of army.projectIds) {
    try {
      const project = await getProject(projectId);
      if (project) {
        projects.push(project);
      }
    } catch (err) {
      // Skip projects we don't have permission to see (e.g. private projects in a public army)
      console.warn(`Skipping inaccessible project ${projectId} in army ${armyId}`);
    }
  }

  return projects;
}

/**
 * Get army member details (role, notes, etc.)
 */
export async function getArmyMember(
  armyId: string,
  projectId: string
): Promise<ArmyMember | null> {
  const memberRef = doc(db, 'armies', armyId, 'members', projectId);
  const memberSnap = await getDoc(memberRef);

  if (memberSnap.exists()) {
    return memberSnap.data() as ArmyMember;
  }

  return null;
}

/**
 * Get all army members with their details
 */
export async function getArmyMembers(armyId: string): Promise<ArmyMember[]> {
  const membersRef = collection(db, 'armies', armyId, 'members');
  const membersSnap = await getDocs(membersRef);

  return membersSnap.docs.map((doc) => doc.data() as ArmyMember);
}

/**
 * Update army member details (role, notes)
 */
export async function updateArmyMember(
  armyId: string,
  projectId: string,
  updates: Partial<Pick<ArmyMember, 'role' | 'notes'>>
): Promise<void> {
  const memberRef = doc(db, 'armies', armyId, 'members', projectId);
  await updateDoc(memberRef, updates);
}

/**
 * Get all armies that contain a specific project
 */
export async function getProjectArmies(projectId: string, currentUserId?: string): Promise<Army[]> {
  const armiesRef = collection(db, 'armies');
  const results: Record<string, Army> = {};

  // 1. Get Public Armies containing this project
  // Requires Index: projectIds (array) + isPublic (asc/desc)
  try {
    const qPublic = query(
      armiesRef,
      where('projectIds', 'array-contains', projectId),
      where('isPublic', '==', true)
    );
    const publicSnap = await getDocs(qPublic);
    publicSnap.docs.forEach(doc => {
      results[doc.id] = doc.data() as Army;
    });
  } catch (err) {
    console.error('Error fetching public project armies:', err);
  }

  // 2. Get My Armies containing this project (if logged in)
  // Requires Index: projectIds (array) + userId (asc/desc)
  if (currentUserId) {
    try {
      const qMine = query(
        armiesRef,
        where('projectIds', 'array-contains', projectId),
        where('userId', '==', currentUserId)
      );
      const mineSnap = await getDocs(qMine);
      mineSnap.docs.forEach(doc => {
        results[doc.id] = doc.data() as Army; // Overwrites duplicates safely
      });
    } catch (err) {
      console.error('Error fetching my project armies:', err);
    }
  }

  return Object.values(results);
}

/**
 * Get public armies (for community feed)
 */
export async function getPublicArmies(limitCount: number = 10): Promise<Army[]> {
  const armiesRef = collection(db, 'armies');

  const q = query(
    armiesRef,
    where('isPublic', '==', true),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Army);
}

/**
 * Update army statistics
 * Recalculates total model count from member projects
 */
export async function updateArmyStats(armyId: string): Promise<void> {
  const projects = await getArmyProjects(armyId);

  // Calculate total model count (sum of all project quantities)
  const totalModels = projects.reduce((sum, project) => {
    return sum + (project.quantity || 1);
  }, 0);

  await updateArmy(armyId, {
    armySize: totalModels,
  });
}

/**
 * Add a tag to an army
 */
export async function addTagToArmy(armyId: string, tag: string): Promise<void> {
  const armyRef = doc(db, 'armies', armyId);

  await updateDoc(armyRef, {
    tags: arrayUnion(tag),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove a tag from an army
 */
export async function removeTagFromArmy(armyId: string, tag: string): Promise<void> {
  const armyRef = doc(db, 'armies', armyId);

  await updateDoc(armyRef, {
    tags: arrayRemove(tag),
    updatedAt: serverTimestamp(),
  });
}
