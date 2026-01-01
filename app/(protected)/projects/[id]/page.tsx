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
import { formatDate } from '@/lib/utils/formatters';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/utils/constants';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
  const projectType = PROJECT_TYPES.find((t) => t.value === project.type)?.label || project.type;
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                  {projectType}
                </span>
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
              onDelete={isOwner ? handleDeletePhoto : undefined}
              canDelete={isOwner}
            />
          )}
        </CardContent>
      </Card>

      {/* Paints Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Paints Used ({project.paintCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <p>Paint tracking feature coming soon!</p>
            <p className="text-sm mt-2">Track which paints you're using for this project.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
