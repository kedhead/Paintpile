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
import { incrementUserStats } from './users';

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
    isPublic: false,
    likeCount: 0,
    commentCount: 0,
  };

  await setDoc(newArmyRef, army);

  // Increment user's army count (if we add this stat)
  // await incrementUserStats(userId, 'armyCount', 1);

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

  const member: Omit<ArmyMember, 'addedAt'> & { addedAt: any } = {
    memberId: projectId,
    projectId,
    addedAt: serverTimestamp(),
    role,
    notes,
  };

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
    const project = await getProject(projectId);
    if (project) {
      projects.push(project);
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
export async function getProjectArmies(projectId: string): Promise<Army[]> {
  const armiesRef = collection(db, 'armies');

  const q = query(armiesRef, where('projectIds', 'array-contains', projectId));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Army);
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
