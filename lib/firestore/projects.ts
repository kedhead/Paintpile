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
import { Project, ProjectFormData } from '@/types/project';
import { incrementUserStats, getUserProfile } from './users';
import { createActivity } from './activities';
import { checkAndAwardBadges } from './badges';

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
    likeCount: 0,
    commentCount: 0,
    armyIds: [],
  };

  await setDoc(newProjectRef, project);

  // Increment user's project count
  await incrementUserStats(userId, 'projectCount', 1);

  // Get user details for activity
  const user = await getUserProfile(userId);

  if (user) {
    // Create activity entry
    try {
      await createActivity(
        userId,
        user.displayName || user.email,
        user.photoURL,
        'project_created',
        projectId,
        'project',
        {
          projectName: projectData.name,
          projectPhotoUrl: projectData.coverPhotoUrl, // Add cover photo
          status: projectData.status,
          visibility: 'private', // New projects are private by default
        }
      );
    } catch (err) {
      console.error('Error creating project activity:', err);
    }

    // Check if user earned any badges
    try {
      await checkAndAwardBadges(userId);
    } catch (err) {
      console.error('Error checking badges:', err);
    }
  }

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

  // If visibility or cover photo is changing, update the activity metadata
  if (updates.isPublic !== undefined || updates.coverPhotoUrl !== undefined) {
    try {
      // Import dynamically to avoid circular dependency
      // We can just query activities directly.
      const activitiesRef = collection(db, 'activities');

      const q = query(
        activitiesRef,
        where('type', '==', 'project_created'),
        where('targetId', '==', projectId),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const activityDoc = snapshot.docs[0];
        const activityUpdates: any = {};

        // Update visibility if changed
        if (updates.isPublic !== undefined) {
          activityUpdates['metadata.visibility'] = updates.isPublic ? 'public' : 'private';
        }

        // Update photo if changed
        if (updates.coverPhotoUrl !== undefined) {
          activityUpdates['metadata.projectPhotoUrl'] = updates.coverPhotoUrl;
        }

        // KEY FIX: If becoming public, bump the createdAt timestamp so it appears at the top of feeds
        if (updates.isPublic) {
          activityUpdates.createdAt = serverTimestamp();
        }

        if (Object.keys(activityUpdates).length > 0) {
          await updateDoc(activityDoc.ref, activityUpdates);
        }
      }
    } catch (err) {
      console.error('Error updating activity visibility/photo:', err);
    }
  }
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
 * Also removes the project from all armies it belongs to
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  // Get the project to check armyIds
  const project = await getProject(projectId);

  if (!project) {
    throw new Error('Project not found');
  }

  if (project.userId !== userId) {
    throw new Error('Unauthorized to delete this project');
  }

  const batch = writeBatch(db);

  // If project belongs to any armies, remove it from them
  if (project.armyIds && project.armyIds.length > 0) {
    for (const armyId of project.armyIds) {
      // Remove project from army's projectIds array
      const armyRef = doc(db, 'armies', armyId);
      batch.update(armyRef, {
        projectIds: arrayRemove(projectId),
        updatedAt: serverTimestamp(),
      });

      // Delete the army member entry
      const memberRef = doc(db, 'armies', armyId, 'members', projectId);
      batch.delete(memberRef);
    }
  }

  // Delete the project itself
  const projectRef = doc(db, 'projects', projectId);
  batch.delete(projectRef);

  await batch.commit();

  // Decrement user's project count
  await incrementUserStats(userId, 'projectCount', -1);

  // Update army stats for all affected armies
  if (project.armyIds && project.armyIds.length > 0) {
    // Import dynamically to avoid circular dependency
    const { updateArmyStats } = await import('./armies');
    for (const armyId of project.armyIds) {
      await updateArmyStats(armyId);
    }
  }
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
