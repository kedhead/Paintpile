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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Project, ProjectFormData } from '@/types/project';
import { incrementUserStats } from './users';

/**
 * Create a new project
 */
export async function createProject(
  userId: string,
  projectData: ProjectFormData
): Promise<string> {
  const projectsRef = collection(db, 'projects');
  const newProjectRef = doc(projectsRef);
  const projectId = newProjectRef.id;

  const project = {
    projectId,
    userId,
    name: projectData.name,
    description: projectData.description || '',
    type: projectData.type,
    status: projectData.status,
    startDate: projectData.startDate ? Timestamp.fromDate(projectData.startDate) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isPublic: false,
    photoCount: 0,
    paintCount: 0,
  };

  await setDoc(newProjectRef, project);

  // Increment user's project count
  await incrementUserStats(userId, 'projectCount', 1);

  return projectId;
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const projectRef = doc(db, 'projects', projectId);
  const projectSnap = await getDoc(projectRef);

  if (projectSnap.exists()) {
    return projectSnap.data() as Project;
  }

  return null;
}

/**
 * Get projects for a specific user
 */
export async function getUserProjects(
  userId: string,
  options?: {
    limitCount?: number;
    status?: 'not-started' | 'in-progress' | 'completed';
  }
): Promise<Project[]> {
  const projectsRef = collection(db, 'projects');

  let q = query(
    projectsRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  if (options?.status) {
    q = query(
      projectsRef,
      where('userId', '==', userId),
      where('status', '==', options.status),
      orderBy('updatedAt', 'desc')
    );
  }

  if (options?.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Project);
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);

  await updateDoc(projectRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  await deleteDoc(projectRef);

  // Decrement user's project count
  await incrementUserStats(userId, 'projectCount', -1);
}

/**
 * Get public projects (for community feed)
 */
export async function getPublicProjects(limitCount: number = 10): Promise<Project[]> {
  const projectsRef = collection(db, 'projects');

  const q = query(
    projectsRef,
    where('isPublic', '==', true),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Project);
}
