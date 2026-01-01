'use client';

import { useEffect, useState } from 'react';
import { Paint } from '@/types/paint';
import { ProjectPaint } from '@/types/paint';
import { getProjectPaints, removePaintFromProject, updateProjectPaintNotes, getProjectPaint } from '@/lib/firestore/project-paints';
import { PaintChip } from '@/components/paints/PaintChip';
import { PaintSelectorModal } from '@/components/paints/PaintSelectorModal';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { addPaintToProject } from '@/lib/firestore/project-paints';

interface ProjectPaintLibraryProps {
  projectId: string;
  userId?: string;
}

export function ProjectPaintLibrary({ projectId, userId }: ProjectPaintLibraryProps) {
  const [paints, setPaints] = useState<Paint[]>([]);
  const [paintMetadata, setPaintMetadata] = useState<Record<string, ProjectPaint>>({});
  const [loading, setLoading] = useState(true);
  const [showPaintSelector, setShowPaintSelector] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadPaints();
  }, [projectId]);

  async function loadPaints() {
    try {
      setLoading(true);
      const paintData = await getProjectPaints(projectId);
      setPaints(paintData);

      // Load metadata for each paint
      const metadata: Record<string, ProjectPaint> = {};
      for (const paint of paintData) {
        const paintMeta = await getProjectPaint(projectId, paint.paintId);
        if (paintMeta) {
          metadata[paint.paintId] = paintMeta;
        }
      }
      setPaintMetadata(metadata);
    } catch (err) {
      console.error('Error loading project paints:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPaints(selectedPaintIds: string[]) {
    try {
      for (const paintId of selectedPaintIds) {
        await addPaintToProject(projectId, paintId, undefined, userId);
      }
      await loadPaints();
      setShowPaintSelector(false);
    } catch (err) {
      console.error('Error adding paints to project:', err);
      alert('Failed to add paints to project');
    }
  }

  async function handleRemovePaint(paintId: string) {
    if (!confirm('Remove this paint from the project? This will not delete any recipes using this paint.')) {
      return;
    }

    try {
      await removePaintFromProject(projectId, paintId);
      await loadPaints();
    } catch (err) {
      console.error('Error removing paint:', err);
      alert('Failed to remove paint');
    }
  }

  async function handleSaveNotes(paintId: string) {
    try {
      await updateProjectPaintNotes(projectId, paintId, notesValue);
      await loadPaints();
      setEditingNotes(null);
      setNotesValue('');
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes');
    }
  }

  function startEditingNotes(paintId: string) {
    setEditingNotes(paintId);
    setNotesValue(paintMetadata[paintId]?.notes || '');
  }

  function cancelEditingNotes() {
    setEditingNotes(null);
    setNotesValue('');
  }

  // Get unique paint types for filter
  const paintTypes = Array.from(new Set(paints.map(p => p.type)));

  // Filter paints by type
  const filteredPaints = filterType === 'all'
    ? paints
    : paints.filter(p => p.type === filterType);

  // Sort by usage count descending
  const sortedPaints = [...filteredPaints].sort((a, b) => {
    const aUsage = paintMetadata[a.paintId]?.usageCount || 0;
    const bUsage = paintMetadata[b.paintId]?.usageCount || 0;
    return bUsage - aUsage;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading paints...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Paint Library ({paints.length})</CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowPaintSelector(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Paints
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paints.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No paints added to this project yet.</p>
              <Button
                variant="ghost"
                onClick={() => setShowPaintSelector(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Paint
              </Button>
            </div>
          ) : (
            <>
              {/* Filter */}
              {paintTypes.length > 1 && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Filter by Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Types ({paints.length})</option>
                    {paintTypes.map(type => (
                      <option key={type} value={type}>
                        {type} ({paints.filter(p => p.type === type).length})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Paint List */}
              <div className="space-y-3">
                {sortedPaints.map(paint => {
                  const metadata = paintMetadata[paint.paintId];
                  const isEditing = editingNotes === paint.paintId;

                  return (
                    <div
                      key={paint.paintId}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <PaintChip paint={paint} size="md" />

                          {/* Usage Count */}
                          {metadata && metadata.usageCount > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              Used {metadata.usageCount} {metadata.usageCount === 1 ? 'time' : 'times'}
                            </div>
                          )}

                          {/* Notes */}
                          <div className="mt-2">
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={notesValue}
                                  onChange={(e) => setNotesValue(e.target.value)}
                                  placeholder="Add notes about this paint..."
                                  rows={2}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveNotes(paint.paintId)}
                                    className="text-green-600 hover:text-green-700 p-1"
                                    title="Save notes"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditingNotes}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    title="Cancel"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                {metadata?.notes ? (
                                  <p className="text-sm text-gray-700 flex-1">{metadata.notes}</p>
                                ) : (
                                  <p className="text-sm text-gray-400 italic flex-1">No notes</p>
                                )}
                                <button
                                  onClick={() => startEditingNotes(paint.paintId)}
                                  className="text-gray-400 hover:text-primary-600 p-1 transition-colors"
                                  title="Edit notes"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemovePaint(paint.paintId)}
                          className="text-gray-400 hover:text-accent-600 transition-colors p-1"
                          title="Remove from project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Paint Selector Modal */}
      {showPaintSelector && (
        <PaintSelectorModal
          selectedPaintIds={paints.map(p => p.paintId)}
          onSelectionChange={handleAddPaints}
          onClose={() => setShowPaintSelector(false)}
          multiSelect={true}
        />
      )}
    </>
  );
}
