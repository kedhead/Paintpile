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
    status: projectData.status,
    quantity: projectData.quantity || 1,
    tags: projectData.tags || [],
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

  let q = query(projectsRef, where('userId', '==', userId));

  if (options?.status) {
    q = query(
      projectsRef,
      where('userId', '==', userId),
      where('status', '==', options.status)
    );
  }

  const querySnapshot = await getDocs(q);
  let projects = querySnapshot.docs.map((doc) => doc.data() as Project);

  // Sort by updatedAt in memory to avoid needing a composite index
  projects.sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() || 0;
    const bTime = b.updatedAt?.toMillis?.() || 0;
    return bTime - aTime; // desc order
  });

  // Apply limit after sorting
  if (options?.limitCount) {
    projects = projects.slice(0, options.limitCount);
  }

  return projects;
}

/**
 * Get projects by a single tag
 */
export async function getProjectsByTag(userId: string, tag: string): Promise<Project[]> {
  const projectsRef = collection(db, 'projects');
  
  const q = query(
    projectsRef,
    where('userId', '==', userId),
    where('tags', 'array-contains', tag)
  );

  const querySnapshot = await getDocs(q);
  let projects = querySnapshot.docs.map((doc) => doc.data() as Project);

  // Sort by updatedAt in memory
  projects.sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() || 0;
    const bTime = b.updatedAt?.toMillis?.() || 0;
    return bTime - aTime; // desc order
  });

  return projects;
}

/**
 * Get projects by multiple tags (must have ALL specified tags)
 */
export async function getProjectsByTags(userId: string, tags: string[]): Promise<Project[]> {
  if (tags.length === 0) {
    return getUserProjects(userId);
  }

  // For multiple tags, we need to filter in memory since Firestore
  // doesn't support array-contains-all with other where clauses
  const allProjects = await getUserProjects(userId);
  
  return allProjects.filter(project => 
    tags.every(tag => project.tags.includes(tag))
  );
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
 * Add a tag to a project
 */
export async function addTagToProject(projectId: string, tag: string): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  
  await updateDoc(projectRef, {
    tags: arrayUnion(tag),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove a tag from a project
 */
export async function removeTagFromProject(projectId: string, tag: string): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  
  await updateDoc(projectRef, {
    tags: arrayRemove(tag),
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
