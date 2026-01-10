'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getArmy, deleteArmy, updateArmy, getArmyProjects } from '@/lib/firestore/armies';
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

      // Load cover photos for projects
      const photoMap: Record<string, string> = {};
      await Promise.all(
        armyProjects.map(async (project) => {
          try {
            const photos = await getProjectPhotos(project.projectId);
            if (photos.length > 0) {
              let coverPhoto = photos[0];
              if (project.featuredPhotoId) {
                const featuredPhoto = photos.find(p => p.photoId === project.featuredPhotoId);
                if (featuredPhoto) {
                  coverPhoto = featuredPhoto;
                }
              }
              photoMap[project.projectId] = coverPhoto.thumbnailUrl || coverPhoto.url;
            }
          } catch (err) {
            console.error(`Error loading photos for project ${project.projectId}:`, err);
          }
        })
      );
      setCoverPhotos(photoMap);
    } catch (err) {
      console.error('Error loading army:', err);
      setError('Failed to load army');
    } finally {
      setLoading(false);
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

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-display font-bold">
                  {army.name}
                </h1>
              </div>
              {army.faction && (
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
