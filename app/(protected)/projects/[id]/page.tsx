'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProject, deleteProject, updateProject } from '@/lib/firestore/projects';
import { getProjectPhotos, deletePhotoFromProject } from '@/lib/firestore/photos';
import { deletePhoto as deletePhotoStorage } from '@/lib/firebase/storage';
import { Project } from '@/types/project';
import { Photo } from '@/types/photo';
import { Paint } from '@/types/paint';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PhotoUpload } from '@/components/photos/PhotoUpload';
import { PhotoGallery } from '@/components/photos/PhotoGallery';
import { ProjectPaintLibrary } from '@/components/paints/ProjectPaintLibrary';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeEditor } from '@/components/recipes/RecipeEditor';
import { TechniqueList } from '@/components/techniques/TechniqueList';
import { ProjectTimeline } from '@/components/timeline/ProjectTimeline';
import { formatDate } from '@/lib/utils/formatters';
import { getProjectRecipes, createPaintRecipe, updatePaintRecipe, deletePaintRecipe } from '@/lib/firestore/paint-recipes';
import { PaintRecipe, PaintRecipeFormData } from '@/types/paint-recipe';
import { getPaintsByIds } from '@/lib/firestore/paints';
import { PaintChipList } from '@/components/paints/PaintChip';
import { ArrowLeft, Calendar, Tag, Palette, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationPaints, setAnnotationPaints] = useState<Paint[]>([]);
  const heroImageRef = useRef<HTMLImageElement>(null);

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

  function updateHeroImageSize() {
    if (heroImageRef.current) {
      setImageSize({
        width: heroImageRef.current.clientWidth,
        height: heroImageRef.current.clientHeight,
      });
    }
  }

  function handlePreviousPhoto() {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setSelectedAnnotationId(null);
    setAnnotationPaints([]);
  }

  function handleNextPhoto() {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setSelectedAnnotationId(null);
    setAnnotationPaints([]);
  }

  async function handleSetFeaturedPhoto(photoId: string) {
    if (!project || !currentUser) return;

    try {
      await updateProject(project.projectId, { featuredPhotoId: photoId });
      setProject({ ...project, featuredPhotoId: photoId });
    } catch (err) {
      console.error('Error setting featured photo:', err);
      alert('Failed to set featured photo');
    }
  }

  async function handleAnnotationClick(annotationId: string, paintIds: string[]) {
    setSelectedAnnotationId(annotationId);
    if (paintIds.length > 0) {
      try {
        const paints = await getPaintsByIds(paintIds);
        setAnnotationPaints(paints);
      } catch (err) {
        console.error('Error loading annotation paints:', err);
      }
    } else {
      setAnnotationPaints([]);
    }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground mb-4">{error || 'Project not found'}</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = project.userId === currentUser?.uid;
  const coverPhoto = photos[0]?.url || '/placeholder-project.jpg';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </div>
          </Link>
          <h1 className="text-2xl font-display font-bold">Project Analysis</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Image Area */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden border border-border group">
              {photos.length > 0 ? (
                <>
                  <div className="relative w-full h-full">
                    <img
                      ref={heroImageRef}
                      src={photos[currentPhotoIndex].url}
                      alt={photos[currentPhotoIndex].caption || project.name}
                      className="w-full h-full object-cover"
                      onLoad={updateHeroImageSize}
                    />

                    {/* Annotation Markers */}
                    {photos[currentPhotoIndex].annotations && photos[currentPhotoIndex].annotations!.length > 0 && imageSize.width > 0 && (
                      <>
                        {photos[currentPhotoIndex].annotations!.map((annotation) => {
                          const pixelX = (annotation.x / 100) * imageSize.width;
                          const pixelY = (annotation.y / 100) * imageSize.height;

                          // Generate consistent color from annotation ID
                          const hash = annotation.id.split('').reduce((acc, char) => {
                            return char.charCodeAt(0) + ((acc << 5) - acc);
                          }, 0);
                          const hue = Math.abs(hash % 360);
                          const markerColor = `hsl(${hue}, 70%, 50%)`;
                          const isSelected = selectedAnnotationId === annotation.id;

                          return (
                            <button
                              key={annotation.id}
                              onClick={() => handleAnnotationClick(annotation.id, annotation.paints.map(p => p.paintId))}
                              className="absolute flex items-center gap-2 cursor-pointer hover:scale-110 transition-transform"
                              style={{
                                left: `${pixelX}px`,
                                top: `${pixelY}px`,
                                transform: 'translate(-50%, -50%)',
                              }}
                            >
                              {/* Marker Dot */}
                              <div
                                className={`w-6 h-6 rounded-full border-2 shadow-lg ${
                                  isSelected ? 'border-white scale-125' : 'border-white/80'
                                }`}
                                style={{ backgroundColor: markerColor }}
                              />
                              {/* Label */}
                              {annotation.label && (
                                <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                  isSelected ? 'bg-white text-gray-900' : 'bg-black/70 text-white'
                                }`}>
                                  {annotation.label}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Photo Counter */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {currentPhotoIndex + 1} / {photos.length}
                    </div>
                  )}

                  {/* Featured Photo Badge */}
                  {project.featuredPhotoId === photos[currentPhotoIndex].photoId && (
                    <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Featured
                    </div>
                  )}

                  {/* Set Featured Button */}
                  {isOwner && project.featuredPhotoId !== photos[currentPhotoIndex].photoId && (
                    <button
                      onClick={() => handleSetFeaturedPhoto(photos[currentPhotoIndex].photoId)}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star className="w-3 h-3" />
                      Set as Featured
                    </button>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">No photos yet</p>
                    {isOwner && (
                      <PhotoUpload
                        userId={currentUser!.uid}
                        projectId={projectId}
                        onUploadComplete={loadPhotos}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Upload more photos button */}
            {isOwner && photos.length > 0 && (
              <div className="mt-4">
                <PhotoUpload
                  userId={currentUser!.uid}
                  projectId={projectId}
                  onUploadComplete={loadPhotos}
                />
              </div>
            )}

            {/* Selected Annotation Details */}
            {selectedAnnotationId && photos.length > 0 && (() => {
              const annotation = photos[currentPhotoIndex].annotations?.find(a => a.id === selectedAnnotationId);
              if (!annotation) return null;

              return (
                <div className="mt-4 bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-card-foreground">
                      {annotation.label}
                    </h4>
                    <button
                      onClick={() => setSelectedAnnotationId(null)}
                      className="text-xs text-muted-foreground hover:text-card-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  {annotation.notes && (
                    <p className="text-sm text-muted-foreground mb-3">{annotation.notes}</p>
                  )}
                  {annotationPaints.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-card-foreground mb-2">
                        Paints ({annotationPaints.length}):
                      </p>
                      <PaintChipList paints={annotationPaints} size="sm" />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Sidebar - Project Info */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={project.status} />
                {project.isPublic && (
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Public</span>
                )}
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-1">{project.name}</h2>
              <p className="text-lg text-muted-foreground mb-6">{project.description || 'No description'}</p>

              <div className="flex flex-col gap-3 py-4 border-y border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(project.createdAt)}</span>
                </div>
                <div className="text-xs text-muted-foreground opacity-60 italic">
                  Last updated {formatDate(project.updatedAt)}
                </div>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="mt-6">
                  <div className="flex gap-2 flex-wrap">
                    {project.tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border text-[10px] font-bold uppercase tracking-wider text-secondary-foreground"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isOwner && (
                <div className="mt-6 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={togglePublic}
                  >
                    {project.isPublic ? 'Make Private' : 'Make Public'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Project'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-6 mt-12 relative z-20">
        <div className="bg-card rounded-xl border border-border shadow-xl p-6 md:p-8">
          <Tabs defaultValue="log" className="w-full">
            <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-6 mb-6">
              <TabsTrigger
                value="log"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground px-0 py-2 text-muted-foreground transition-all text-base"
              >
                Progress Log
              </TabsTrigger>
              <TabsTrigger
                value="colors"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground px-0 py-2 text-muted-foreground transition-all text-base"
              >
                Palette & Recipes
              </TabsTrigger>
              <TabsTrigger
                value="techniques"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground px-0 py-2 text-muted-foreground transition-all text-base"
              >
                Techniques
              </TabsTrigger>
            </TabsList>

            {/* Progress Log Tab */}
            <TabsContent value="log" className="mt-0">
              <div className="space-y-6">
                {/* Photo Gallery */}
                {photos.length > 0 && (
                  <div>
                    <h3 className="font-display font-bold mb-4">Project Photos ({photos.length})</h3>
                    <PhotoGallery
                      photos={photos}
                      projectId={projectId}
                      userId={currentUser?.uid}
                      onDelete={isOwner ? handleDeletePhoto : undefined}
                      onPhotoUpdate={loadPhotos}
                      canDelete={isOwner}
                      canAnnotate={isOwner}
                    />
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <ProjectTimeline projectId={projectId} />
                </div>
              </div>
            </TabsContent>

            {/* Palette & Recipes Tab */}
            <TabsContent value="colors" className="mt-0">
              <div className="space-y-6">
                {/* Paint Library */}
                {isOwner && <ProjectPaintLibrary projectId={projectId} userId={currentUser?.uid} />}

                {/* Recipes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Paint Recipes
                    </h3>
                    {isOwner && !showRecipeEditor && (
                      <Button size="sm" onClick={() => setShowRecipeEditor(true)}>
                        Create Recipe
                      </Button>
                    )}
                  </div>

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
                      <Spinner />
                    </div>
                  ) : recipes.length === 0 ? (
                    <div className="p-4 bg-card rounded border border-border border-dashed text-center text-muted-foreground text-sm">
                      <p>No custom mixes recorded yet.</p>
                      {isOwner && (
                        <Button variant="link" className="text-primary mt-1 h-auto p-0" onClick={() => setShowRecipeEditor(true)}>
                          Create Recipe
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipes.map((recipe) => (
                        <div key={recipe.recipeId} className="relative">
                          <RecipeCard recipe={recipe} />
                          {isOwner && (
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditRecipe(recipe)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteRecipe(recipe.recipeId)}>
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Techniques Tab */}
            <TabsContent value="techniques" className="mt-0">
              {isOwner ? (
                <TechniqueList projectId={projectId} userId={currentUser?.uid} />
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Technique notes coming soon.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
