'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectsByTag, deleteProject, updateProject } from '@/lib/firestore/projects';
import { Project } from '@/types/project';
import { TAG_SHAME } from '@/lib/utils/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Plus, Trash2, Play, Check, BarChart3 } from 'lucide-react';
import { PileItemForm } from '@/components/pile/PileItemForm';
import { PileStats } from '@/components/pile/PileStats';

export default function PilePage() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadProjects();
    }
  }, [currentUser]);

  async function loadProjects() {
    try {
      setLoading(true);
      const shameProjects = await getProjectsByTag(currentUser!.uid, TAG_SHAME);
      setProjects(shameProjects);
    } catch (err) {
      console.error('Error loading pile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: Project) {
    if (!confirm(`Delete "${item.name}" from your pile?`)) return;

    try {
      await deleteProject(item.projectId, currentUser!.uid);
      await loadProjects();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    }
  }

  async function handleStartPainting(item: Project) {
    try {
      await updateProject(item.projectId, { status: 'in-progress' });
      await loadProjects();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  }

  async function handleCompletePainting(item: Project) {
    try {
      await updateProject(item.projectId, { status: 'completed' });
      await loadProjects();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingItem(null);
    loadProjects();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'bg-muted text-muted-foreground';
      case 'in-progress':
        return 'bg-primary/10 text-primary';
      case 'completed':
        return 'bg-green-500/10 text-green-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'Not Started';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  // Calculate total miniatures from projects
  const totalMiniatures = projects.reduce((sum, p) => sum + (p.quantity || 1), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pile of Shame</h1>
          <p className="text-muted-foreground mt-1">
            Track your unpainted miniatures and painting progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="hidden sm:inline">{showStats ? 'Hide' : 'Show'} Stats</span>
          </Button>
          <Button
            variant="default"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add to Pile
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {showStats && <PileStats projects={projects} />}

      {/* Pile Items */}
      <Card>
        <CardHeader>
          <CardTitle>Your Pile ({projects.length} items, {totalMiniatures} miniatures)</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg font-medium">Your pile is empty!</p>
              <p className="text-sm mt-2">Add your first unpainted miniature to get started.</p>
              <Button
                variant="default"
                onClick={() => setShowForm(true)}
                className="mt-4"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add to Pile
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((item) => (
                <div
                  key={item.projectId}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        {item.tags?.filter((tag) => tag !== TAG_SHAME).map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {tag}
                          </span>
                        ))}
                        <span className="text-sm text-muted-foreground">
                          Qty: {item.quantity || 1}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:ml-4">
                      {item.status === 'not-started' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartPainting(item)}
                          className="flex items-center gap-1"
                          title="Start painting"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {item.status === 'in-progress' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompletePainting(item)}
                          className="flex items-center gap-1"
                          title="Mark as completed"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setShowForm(true);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <PileItemForm
          userId={currentUser!.uid}
          editingItem={editingItem}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
