'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getArmy, deleteArmy, updateArmy, getArmyProjects } from '@/lib/firestore/armies';
import { deleteField } from 'firebase/firestore';
import { Army } from '@/types/army';
import { Project } from '@/types/project';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ArmyForm } from '@/components/armies/ArmyForm';
import { ArmyMemberManager } from '@/components/armies/ArmyMemberManager';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { getProjectPhotos } from '@/lib/firestore/photos';
import { ArrowLeft, Edit2, Trash2, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ArmyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const armyId = params.id as string;

  const [army, setArmy] = useState<Army | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [featuredPhotoUrl, setFeaturedPhotoUrl] = useState<string | null>(null);
  const [projectCoverIds, setProjectCoverIds] = useState<Record<string, string>>({});
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadArmy();
    }
  }, [armyId, currentUser]);

  async function loadArmy() {
    try {
      setLoading(true);
      const armyData = await getArmy(armyId);

      if (!armyData) {
        setError('Army not found');
        return;
      }

      // Check if user has access to view this army
      if (armyData.userId !== currentUser?.uid && !armyData.isPublic) {
        setError('You do not have permission to view this army');
        return;
      }

      setArmy(armyData);

      // Load projects in this army
      const armyProjects = await getArmyProjects(armyId);
      setProjects(armyProjects);

      // Load cover photos for projects and determine army hero image
      const photoMap: Record<string, string> = {};
      const idMap: Record<string, string> = {};
      let foundFeatured = false;
      let heroUrl = armyData.customPhotoUrl || null;

      await Promise.all(
        armyProjects.map(async (project) => {
          try {
            const photos = await getProjectPhotos(project.projectId);
            if (photos.length > 0) {
              let coverPhoto = photos[0];
              // Respect project's own featured photo settings
              if (project.featuredPhotoId) {
                const featured = photos.find(p => p.photoId === project.featuredPhotoId);
                if (featured) coverPhoto = featured;
              }

              const url = coverPhoto.thumbnailUrl || coverPhoto.url;
              photoMap[project.projectId] = url;
              idMap[project.projectId] = coverPhoto.photoId;

              // Check if this is the army's featured photo (if not using custom)
              if (!heroUrl && armyData.featuredPhotoId === coverPhoto.photoId) {
                heroUrl = coverPhoto.url; // Use full res for hero
                foundFeatured = true;
              }
            }
          } catch (err) {
            console.error(`Error loading photos for project ${project.projectId}:`, err);
          }
        })
      );

      // Fallback: If no custom photo and featured photo not found (or not set), use first project's cover
      if (!heroUrl && armyProjects.length > 0) {
        // We might not have the URL yet if we didn't match the ID perfectly or order matters.
        // Let's just grab the first one from the map if it exists.
        const firstProjectId = armyProjects[0].projectId;
        if (photoMap[firstProjectId]) {
          // Ideally we'd want the full res URL here, but map has thumbnail. 
          // For now, thumbnail/url might be same or close enough.
          // Improve: fetch full res if needed.
          heroUrl = photoMap[firstProjectId];
        }
      }

      setCoverPhotos(photoMap);
      setProjectCoverIds(idMap);
      setFeaturedPhotoUrl(heroUrl);

    } catch (err) {
      console.error('Error loading army:', err);
      setError('Failed to load army');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetFeaturedPhoto(projectId: string) {
    if (!army || !currentUser) return;
    const photoId = projectCoverIds[projectId];
    if (!photoId) {
      alert('This project has no photos to feature.');
      return;
    }

    try {
      await updateArmy(army.armyId, {
        featuredPhotoId: photoId,
        customPhotoUrl: deleteField() as unknown as string
      });
      setArmy({ ...army, featuredPhotoId: photoId, customPhotoUrl: undefined });

      // Update the hero URL display immediately
      // We need the full URL. We only have what's in coverPhotos (thumbnail/url). 
      // It's acceptable for immediate feedback.
      setFeaturedPhotoUrl(coverPhotos[projectId]);

    } catch (err) {
      console.error('Error updating featured photo:', err);
      alert('Failed to update army cover photo');
    }
  }

  async function handleDelete() {
    if (!army || !currentUser) return;

    const confirmed = confirm('Are you sure you want to delete this army? This cannot be undone. Projects will not be deleted.');
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteArmy(army.armyId, currentUser.uid);
      router.push('/armies');
    } catch (err) {
      console.error('Error deleting army:', err);
      alert('Failed to delete army. Please try again.');
      setIsDeleting(false);
    }
  }

  async function togglePublic() {
    if (!army || !currentUser) return;

    try {
      const newIsPublic = !army.isPublic;
      await updateArmy(army.armyId, { isPublic: newIsPublic });
      setArmy({ ...army, isPublic: newIsPublic });
    } catch (err) {
      console.error('Error updating army:', err);
      alert('Failed to update army visibility');
    }
  }

  function handleEditSuccess(armyId: string) {
    setIsEditing(false);
    loadArmy(); // Reload to show updated data
  }

  const isOwner = currentUser && army && army.userId === currentUser.uid;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Link href="/armies">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Armies
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!army) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto p-6">
          <Link href="/armies">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Armies
            </Button>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* Hero Image Section */}
            <div className="md:col-span-1">
              <div className="aspect-[4/3] bg-muted rounded-xl overflow-hidden border border-border shadow-md relative group">
                {featuredPhotoUrl ? (
                  <img
                    src={featuredPhotoUrl}
                    alt={army?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                    <Shield className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
                {army?.customPhotoUrl && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    Custom Upload
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-display font-bold">
                  {army?.name}
                </h1>
              </div>
              {army?.faction && (
                <p className="text-lg text-muted-foreground mb-2">
                  Faction: {army.faction}
                </p>
              )}
              {army.description && (
                <p className="text-muted-foreground">
                  {army.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                </span>
                {army.armySize && army.armySize > 0 && (
                  <span>{army.armySize} {army.armySize === 1 ? 'model' : 'models'}</span>
                )}
              </div>
              {army.tags && army.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {army.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel Edit' : 'Edit'}
                </Button>
                <Button
                  variant="outline"
                  onClick={togglePublic}
                >
                  {army.isPublic ? 'Make Private' : 'Make Public'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Edit Form */}
        {isEditing && isOwner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Edit Army</CardTitle>
              </CardHeader>
              <CardContent>
                <ArmyForm
                  userId={currentUser!.uid}
                  editingArmy={army}
                  onSuccess={handleEditSuccess}
                  onCancel={() => setIsEditing(false)}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Member Management */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Army Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <ArmyMemberManager
                army={army}
                currentProjects={projects}
                userId={currentUser!.uid}
                onUpdate={loadArmy}
              />
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        {projects.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">
              Army Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.projectId}
                  project={project}
                  coverPhotoUrl={coverPhotos[project.projectId]}
                  isFeatured={army?.featuredPhotoId === projectCoverIds[project.projectId]}
                  onSetFeatured={isOwner ? handleSetFeaturedPhoto : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {!isOwner && projects.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No projects in this army yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
