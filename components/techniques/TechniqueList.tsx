'use client';

import { useEffect, useState } from 'react';
import { ProjectTechnique, TechniqueFormData, TECHNIQUE_LABELS, TechniqueCategory } from '@/types/technique';
import { getProjectTechniques, addTechnique, deleteTechnique, updateTechnique } from '@/lib/firestore/techniques';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';

interface TechniqueListProps {
  projectId: string;
  userId?: string;
}

export function TechniqueList({ projectId, userId }: TechniqueListProps) {
  const [techniques, setTechniques] = useState<ProjectTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TechniqueFormData>({
    name: '',
    category: 'other',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTechniques();
  }, [projectId]);

  async function loadTechniques() {
    try {
      setLoading(true);
      const data = await getProjectTechniques(projectId);
      setTechniques(data);
    } catch (err) {
      console.error('Error loading techniques:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Technique name is required');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingId) {
        // Update existing technique
        await updateTechnique(projectId, editingId, formData);
      } else {
        // Create new technique
        await addTechnique(projectId, formData, userId);
      }

      await loadTechniques();
      resetForm();
    } catch (err) {
      console.error('Error saving technique:', err);
      alert('Failed to save technique');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(techniqueId: string) {
    if (!confirm('Delete this technique? This cannot be undone.')) {
      return;
    }

    try {
      await deleteTechnique(projectId, techniqueId);
      await loadTechniques();
    } catch (err) {
      console.error('Error deleting technique:', err);
      alert('Failed to delete technique');
    }
  }

  function startEditing(technique: ProjectTechnique) {
    setEditingId(technique.techniqueId);
    setFormData({
      name: technique.name,
      category: technique.category,
      description: technique.description || '',
    });
    setShowAddForm(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      category: 'other',
      description: '',
    });
    setShowAddForm(false);
    setEditingId(null);
  }

  // Get category badge color
  function getCategoryColor(category: TechniqueCategory): string {
    const colors: Record<TechniqueCategory, string> = {
      nmm: 'bg-yellow-100 text-yellow-800',
      osl: 'bg-purple-100 text-purple-800',
      drybrushing: 'bg-orange-100 text-orange-800',
      layering: 'bg-blue-100 text-blue-800',
      glazing: 'bg-green-100 text-green-800',
      washing: 'bg-cyan-100 text-cyan-800',
      blending: 'bg-pink-100 text-pink-800',
      feathering: 'bg-indigo-100 text-indigo-800',
      stippling: 'bg-red-100 text-red-800',
      wetblending: 'bg-teal-100 text-teal-800',
      zenithal: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-600',
    };
    return colors[category] || colors.other;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading techniques...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Techniques ({techniques.length})</CardTitle>
          {!showAddForm && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Technique
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add/Edit Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="space-y-3">
              <Input
                label="Technique Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Gold NMM, Skin Glazing"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as TechniqueCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(TECHNIQUE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Describe how you used this technique..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {editingId ? 'Update' : 'Add'} Technique
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Technique List */}
        {techniques.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No techniques added yet.</p>
            {!showAddForm && (
              <Button
                variant="ghost"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Technique
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {techniques.map(technique => (
              <div
                key={technique.techniqueId}
                className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{technique.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(technique.category)}`}>
                        {TECHNIQUE_LABELS[technique.category]}
                      </span>
                    </div>

                    {technique.description && (
                      <p className="text-sm text-gray-600 mb-2">{technique.description}</p>
                    )}

                    {technique.photoIds && technique.photoIds.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Used in {technique.photoIds.length} {technique.photoIds.length === 1 ? 'photo' : 'photos'}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditing(technique)}
                      className="text-gray-400 hover:text-primary-600 transition-colors p-1"
                      title="Edit technique"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(technique.techniqueId)}
                      className="text-gray-400 hover:text-accent-600 transition-colors p-1"
                      title="Delete technique"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
