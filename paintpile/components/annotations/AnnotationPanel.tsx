'use client';

import { useState, useEffect } from 'react';
import { PhotoAnnotation, AnnotationPaint } from '@/types/photo';
import { Paint } from '@/types/paint';
import { getPaintsByIds } from '@/lib/firestore/paints';
import { PaintChip } from '@/components/paints/PaintChip';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PaintSelectorModal } from '@/components/paints/PaintSelectorModal';
import { Trash2, Plus, X } from 'lucide-react';

interface AnnotationPanelProps {
  annotation: PhotoAnnotation | null;
  onUpdate: (annotation: PhotoAnnotation) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function AnnotationPanel({
  annotation,
  onUpdate,
  onDelete,
  onClose,
}: AnnotationPanelProps) {
  const [paints, setPaints] = useState<Paint[]>([]);
  const [loading, setLoading] = useState(false);
  const [editedLabel, setEditedLabel] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [showPaintSelector, setShowPaintSelector] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'base' | 'highlight' | 'shadow'>('base');

  useEffect(() => {
    if (annotation) {
      setEditedLabel(annotation.label);
      setEditedNotes(annotation.notes || '');
      loadPaints();
    }
  }, [annotation]);

  async function loadPaints() {
    if (!annotation || annotation.paints.length === 0) {
      setPaints([]);
      return;
    }

    try {
      setLoading(true);
      const paintIds = annotation.paints.map((p) => p.paintId);
      const paintData = await getPaintsByIds(paintIds);
      setPaints(paintData);
    } catch (err) {
      console.error('Error loading paints:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleLabelChange() {
    if (!annotation || !editedLabel.trim()) return;

    onUpdate({
      ...annotation,
      label: editedLabel.trim(),
    });
  }

  function handleNotesChange() {
    if (!annotation) return;

    onUpdate({
      ...annotation,
      notes: editedNotes.trim() || undefined,
    });
  }

  function handleAddPaint(selectedPaintIds: string[]) {
    if (!annotation || selectedPaintIds.length === 0) {
      setShowPaintSelector(false);
      return;
    }

    const newPaints: AnnotationPaint[] = selectedPaintIds.map((paintId) => ({
      paintId,
      role: selectedRole,
      ratio: '',
      notes: '',
    }));

    onUpdate({
      ...annotation,
      paints: [...annotation.paints, ...newPaints],
    });

    setShowPaintSelector(false);
    loadPaints();
  }

  function handleRemovePaint(paintId: string) {
    if (!annotation) return;

    onUpdate({
      ...annotation,
      paints: annotation.paints.filter((p) => p.paintId !== paintId),
    });

    loadPaints();
  }

  function handleUpdateRatio(paintId: string, ratio: string) {
    if (!annotation) return;

    onUpdate({
      ...annotation,
      paints: annotation.paints.map((p) =>
        p.paintId === paintId ? { ...p, ratio } : p
      ),
    });
  }

  if (!annotation) {
    return (
      <div className="bg-card rounded-lg shadow-lg p-6 text-center text-muted-foreground border border-border">
        <p>Select an annotation to view details</p>
        <p className="text-sm mt-1">or click on the photo to add a new one</p>
      </div>
    );
  }

  // Group paints by role
  const groupedPaints = annotation.paints.reduce((acc, paint) => {
    if (!acc[paint.role]) {
      acc[paint.role] = [];
    }
    acc[paint.role].push(paint);
    return acc;
  }, {} as Record<string, AnnotationPaint[]>);

  const roleOrder: Array<'base' | 'highlight' | 'shadow'> = ['base', 'highlight', 'shadow'];
  const roleLabels = {
    base: 'Base',
    highlight: 'Highlight',
    shadow: 'Shadow',
  };

  return (
    <>
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">Annotation Details</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Label Input */}
        <div className="mb-4">
          <Input
            label="Label"
            value={editedLabel}
            onChange={(e) => setEditedLabel(e.target.value)}
            onBlur={handleLabelChange}
            placeholder="e.g., Hat, Skin, Jacket"
          />
        </div>

        {/* Notes Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-card-foreground mb-1">
            Notes
          </label>
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            onBlur={handleNotesChange}
            placeholder="Add notes about this area (e.g., techniques used, paint ratios, etc.)"
            rows={3}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
          />
        </div>

        {/* Paints by Role */}
        <div className="space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-card-foreground">Paints</h4>
          </div>

          {roleOrder.map((role) => {
            const rolePaints = groupedPaints[role] || [];
            if (rolePaints.length === 0) return null;

            return (
              <div key={role}>
                <div className="text-xs font-semibold text-card-foreground uppercase mb-2">
                  {roleLabels[role]}
                </div>
                <div className="space-y-2">
                  {rolePaints.map((annotationPaint) => {
                    const paint = paints.find((p) => p.paintId === annotationPaint.paintId);
                    if (!paint) return null;

                    return (
                      <div key={annotationPaint.paintId} className="flex items-start gap-2">
                        <div className="flex-1">
                          <PaintChip paint={paint} size="sm" />
                          <input
                            type="text"
                            value={annotationPaint.ratio || ''}
                            onChange={(e) =>
                              handleUpdateRatio(annotationPaint.paintId, e.target.value)
                            }
                            placeholder="Ratio (e.g., 1:2, thin coat)"
                            className="mt-1 w-full px-2 py-1 text-xs bg-input border border-border rounded text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <button
                          onClick={() => handleRemovePaint(annotationPaint.paintId)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {annotation.paints.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No paints added yet
            </p>
          )}
        </div>

        {/* Add Paint */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-medium text-card-foreground">
            Add paint as
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="base">Base</option>
            <option value="highlight">Highlight</option>
            <option value="shadow">Shadow</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPaintSelector(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Paint
          </Button>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Annotation
          </Button>
        </div>
      </div>

      {/* Paint Selector Modal */}
      {showPaintSelector && (
        <PaintSelectorModal
          onSelectionChange={handleAddPaint}
          onClose={() => setShowPaintSelector(false)}
          multiSelect={true}
        />
      )}
    </>
  );
}
