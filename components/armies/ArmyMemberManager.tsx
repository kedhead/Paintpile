'use client';

import { useState, useEffect } from 'react';
import { Army, ArmyMember } from '@/types/army';
import { Project } from '@/types/project';
import {
  addProjectToArmy,
  removeProjectFromArmy,
  getArmyMembers,
  updateArmyMember,
} from '@/lib/firestore/armies';
import { getUserProjects } from '@/lib/firestore/projects';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface ArmyMemberManagerProps {
  army: Army;
  currentProjects: Project[];
  userId: string;
  onUpdate?: () => void;
}

export function ArmyMemberManager({ army, currentProjects, userId, onUpdate }: ArmyMemberManagerProps) {
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<ArmyMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [army.armyId, userId]);

  async function loadData() {
    try {
      // Load all user's projects
      const allProjects = await getUserProjects(userId);

      // Filter out projects already in this army
      const available = allProjects.filter(
        (p) => !army.projectIds.includes(p.projectId)
      );
      setAvailableProjects(available);

      // Load member details
      const memberDetails = await getArmyMembers(army.armyId);
      setMembers(memberDetails);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }

  async function handleAddProject(projectId: string) {
    try {
      setLoading(true);
      await addProjectToArmy(army.armyId, projectId);
      await loadData();
      setShowAddModal(false);
      onUpdate?.();
    } catch (err: any) {
      alert(err.message || 'Failed to add project to army');
      console.error('Error adding project:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveProject(projectId: string) {
    if (!confirm('Remove this project from the army?')) return;

    try {
      setLoading(true);
      await removeProjectFromArmy(army.armyId, projectId);
      await loadData();
      onUpdate?.();
    } catch (err: any) {
      alert(err.message || 'Failed to remove project from army');
      console.error('Error removing project:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateMember(projectId: string) {
    try {
      setLoading(true);
      await updateArmyMember(army.armyId, projectId, {
        role: editRole || undefined,
        notes: editNotes || undefined,
      });
      setEditingMember(null);
      await loadData();
      onUpdate?.();
    } catch (err: any) {
      alert(err.message || 'Failed to update member details');
      console.error('Error updating member:', err);
    } finally {
      setLoading(false);
    }
  }

  function startEditMember(projectId: string) {
    const member = members.find((m) => m.projectId === projectId);
    if (member) {
      setEditRole(member.role || '');
      setEditNotes(member.notes || '');
      setEditingMember(projectId);
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Army Projects ({currentProjects.length})</h3>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            disabled={availableProjects.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        {currentProjects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No projects in this army yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentProjects.map((project) => {
              const member = members.find((m) => m.projectId === project.projectId);
              const isEditing = editingMember === project.projectId;

              return (
                <Card key={project.projectId}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{project.name}</h4>
                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              placeholder="Role (e.g., HQ, Troops, Elites)"
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-border rounded-md"
                            />
                            <textarea
                              placeholder="Notes..."
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-border rounded-md"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleUpdateMember(project.projectId)}
                                disabled={loading}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingMember(null)}
                                disabled={loading}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {member?.role && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Role: {member.role}
                              </p>
                            )}
                            {member?.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {member.notes}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditMember(project.projectId)}
                            disabled={loading}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveProject(project.projectId)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Project to Army</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {availableProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  All your projects are already in this army
                </p>
              ) : (
                <div className="space-y-2">
                  {availableProjects.map((project) => (
                    <div
                      key={project.projectId}
                      className="p-3 border border-border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddProject(project.projectId)}
                        disabled={loading}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
