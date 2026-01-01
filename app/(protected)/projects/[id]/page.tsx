'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProject, deleteProject, updateProject } from '@/lib/firestore/projects';
import { getProjectPhotos, deletePhotoFromProject } from '@/lib/firestore/photos';
import { deletePhoto as deletePhotoStorage } from '@/lib/firebase/storage';
import { Project } from '@/types/project';
import { Photo } from '@/types/photo';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PhotoUpload } from '@/components/photos/PhotoUpload';
import { PhotoGallery } from '@/components/photos/PhotoGallery';
import { ProjectPaintLibrary } from '@/components/paints/ProjectPaintLibrary';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeEditor } from '@/components/recipes/RecipeEditor';
import { TechniqueList } from '@/components/techniques/TechniqueList';
import { ProjectTimeline } from '@/components/timeline/ProjectTimeline';
import { formatDate } from '@/lib/utils/formatters';
import { PROJECT_STATUSES } from '@/lib/utils/constants';
import { getProjectRecipes, createPaintRecipe, updatePaintRecipe, deletePaintRecipe } from '@/lib/firestore/paint-recipes';
import { PaintRecipe, PaintRecipeFormData } from '@/types/paint-recipe';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [recipes, setRecipes] = useState<PaintRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRecipeEditor, setShowRecipeEditor] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<PaintRecipe | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        const projectData = await getProject(projectId);

        if (!projectData) {
          setError('Project not found');
          return;
        }

        // Check if user has access to view this project
        if (projectData.userId !== currentUser?.uid && !projectData.isPublic) {
          setError('You do not have permission to view this project');
          return;
        }

        setProject(projectData);
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      loadProject();
      loadPhotos();
      loadRecipes();
    }
  }, [projectId, currentUser]);

  async function loadPhotos() {
    try {
      setLoadingPhotos(true);
      const projectPhotos = await getProjectPhotos(projectId);
      setPhotos(projectPhotos);
    } catch (err) {
      console.error('Error loading photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
  }

  async function loadRecipes() {
    try {
      setLoadingRecipes(true);
      const projectRecipes = await getProjectRecipes(projectId);
      setRecipes(projectRecipes);
    } catch (err) {
      console.error('Error loading recipes:', err);
    } finally {
      setLoadingRecipes(false);
    }
  }

  async function handleDelete() {
    if (!project || !currentUser) return;

    const confirmed = confirm('Are you sure you want to delete this project? This cannot be undone.');
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteProject(project.projectId, currentUser.uid);
      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
      setIsDeleting(false);
    }
  }

  async function togglePublic() {
    if (!project || !currentUser) return;

    try {
      const newIsPublic = !project.isPublic;
      await updateProject(project.projectId, { isPublic: newIsPublic });
      setProject({ ...project, isPublic: newIsPublic });
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Failed to update project visibility');
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!currentUser) return;

    try {
      await deletePhotoStorage(currentUser.uid, projectId, photoId);
      await deletePhotoFromProject(currentUser.uid, projectId, photoId);
      setPhotos((prev) => prev.filter((p) => p.photoId !== photoId));
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Failed to delete photo');
    }
  }

  async function handleSaveRecipe(data: PaintRecipeFormData) {
    if (!currentUser) return;

    try {
      if (editingRecipe) {
        await updatePaintRecipe(projectId, editingRecipe.recipeId, data, currentUser.uid);
      } else {
        await createPaintRecipe(projectId, data, currentUser.uid);
      }
      await loadRecipes();
      setShowRecipeEditor(false);
      setEditingRecipe(null);
    } catch (err) {
      console.error('Error saving recipe:', err);
      throw err;
    }
  }

  async function handleDeleteRecipe(recipeId: string) {
    if (!confirm('Delete this recipe? This cannot be undone.')) {
      return;
    }

    try {
      await deletePaintRecipe(projectId, recipeId);
      await loadRecipes();
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert('Failed to delete recipe');
    }
  }

  function handleEditRecipe(recipe: PaintRecipe) {
    setEditingRecipe(recipe);
    setShowRecipeEditor(true);
  }

  function handleCancelRecipeEditor() {
    setShowRecipeEditor(false);
    setEditingRecipe(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-accent-600">
            <p className="text-lg font-medium">{error || 'Project not found'}</p>
            <Button variant="ghost" className="mt-4" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOwner = project.userId === currentUser?.uid;
  const projectStatus = PROJECT_STATUSES.find((s) => s.value === project.status)?.label || project.status;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{project.name}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                {project.tags?.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                    {tag}
                  </span>
                ))}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'completed' ? 'bg-success-100 text-success-700' :
                  project.status === 'in-progress' ? 'bg-secondary-100 text-secondary-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {projectStatus}
                </span>
                {project.isPublic && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    Public
                  </span>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={togglePublic}
                  className="text-sm"
                >
                  {project.isPublic ? 'Make Private' : 'Make Public'}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  className="text-sm"
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {project.description && (
            <p className="text-gray-700 mb-4">{project.description}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="font-medium">{formatDate(project.createdAt)}</span>
            </div>
            {project.startDate && (
              <div>
                <span className="text-gray-500">Started:</span>{' '}
                <span className="font-medium">{formatDate(project.startDate)}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Last Updated:</span>{' '}
              <span className="font-medium">{formatDate(project.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos Section */}
      <Card>
        <CardHeader>
          <CardTitle>Photos ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isOwner && (
            <div className="mb-6">
              <PhotoUpload
                userId={currentUser!.uid}
                projectId={projectId}
                onUploadComplete={loadPhotos}
              />
            </div>
          )}

          {loadingPhotos ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <PhotoGallery
              photos={photos}
              projectId={projectId}
              userId={currentUser?.uid}
              onDelete={isOwner ? handleDeletePhoto : undefined}
              onPhotoUpdate={loadPhotos}
              canDelete={isOwner}
              canAnnotate={isOwner}
            />
          )}
        </CardContent>
      </Card>

      {/* Paint Library Section */}
      {isOwner && <ProjectPaintLibrary projectId={projectId} userId={currentUser?.uid} />}

      {/* Paint Recipes Section */}
      {isOwner && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Paint Recipes ({recipes.length})</CardTitle>
              {!showRecipeEditor && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowRecipeEditor(true)}
                >
                  Create Recipe
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showRecipeEditor ? (
              <RecipeEditor
                initialData={editingRecipe ? {
                  name: editingRecipe.name,
                  description: editingRecipe.description,
                  paints: editingRecipe.paints,
                } : undefined}
                onSave={handleSaveRecipe}
                onCancel={handleCancelRecipeEditor}
              />
            ) : loadingRecipes ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-4">No paint recipes yet.</p>
                <p className="text-sm">Create recipes to track paint combinations for different areas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <div key={recipe.recipeId} className="relative">
                    <RecipeCard recipe={recipe} />
                    <div className="absolute top-3 right-3 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRecipe(recipe)}
                        className="h-8 w-8 p-0"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteRecipe(recipe.recipeId)}
                        className="h-8 w-8 p-0"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Techniques Section */}
      {isOwner && <TechniqueList projectId={projectId} userId={currentUser?.uid} />}

      {/* Project Timeline */}
      {isOwner && <ProjectTimeline projectId={projectId} />}
    </div>
  );
}
