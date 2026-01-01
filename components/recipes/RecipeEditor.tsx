'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { PaintRecipeFormData, PaintRole, PaintRecipeEntry } from '@/types/paint-recipe';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PaintSelectorModal } from '@/components/paints/PaintSelectorModal';
import { PaintChip } from '@/components/paints/PaintChip';
import { Paint } from '@/types/paint';
import { getPaintsByIds } from '@/lib/firestore/paints';
import { X, Plus } from 'lucide-react';

interface RecipeEditorProps {
  initialData?: PaintRecipeFormData;
  onSave: (data: PaintRecipeFormData) => Promise<void>;
  onCancel: () => void;
}

const PAINT_ROLES: { value: PaintRole; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'midtone', label: 'Midtone' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'shadow', label: 'Shadow' },
  { value: 'glaze', label: 'Glaze' },
  { value: 'wash', label: 'Wash' },
];

export function RecipeEditor({ initialData, onSave, onCancel }: RecipeEditorProps) {
  const [showPaintSelector, setShowPaintSelector] = useState(false);
  const [selectedRole, setSelectedRole] = useState<PaintRole>('base');
  const [paints, setPaints] = useState<Paint[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm<PaintRecipeFormData>({
    defaultValues: initialData || {
      name: '',
      description: '',
      paints: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'paints',
  });

  // Load paint details when component mounts or fields change
  useEffect(() => {
    if (fields.length > 0) {
      const paintIds = fields.map(f => f.paintId);
      getPaintsByIds(paintIds).then(setPaints);
    }
  }, [fields]);

  const handleAddPaint = async (selectedPaintIds: string[]) => {
    if (selectedPaintIds.length === 0) {
      setShowPaintSelector(false);
      return;
    }

    // Get the paint details
    const newPaints = await getPaintsByIds(selectedPaintIds);

    // Add each paint to the recipe with the selected role
    selectedPaintIds.forEach((paintId, index) => {
      append({
        paintId,
        role: selectedRole,
        ratio: '',
        order: fields.length + index,
      });
    });

    setPaints([...paints, ...newPaints]);
    setShowPaintSelector(false);
  };

  const handleRemovePaint = (index: number) => {
    remove(index);
    // Update order of remaining paints
    const updatedPaints = fields.filter((_, i) => i !== index);
    updatedPaints.forEach((_, i) => {
      // Re-index orders
    });
  };

  const onSubmit = async (data: PaintRecipeFormData) => {
    try {
      setIsSubmitting(true);
      await onSave(data);
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert('Failed to save recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Recipe Name */}
        <Input
          label="Recipe Name"
          placeholder="e.g., Dark Skin Base, Gold Armor Highlight"
          error={errors.name?.message}
          {...register('name', { required: 'Recipe name is required' })}
        />

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Describe this recipe or technique..."
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-primary-500 focus:ring-primary-500"
            {...register('description')}
          />
        </div>

        {/* Paints List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paints ({fields.length})
          </label>

          <div className="space-y-2 mb-3">
            {fields.map((field, index) => {
              const paint = paints.find(p => p.paintId === field.paintId);

              return (
                <div key={field.id} className="flex items-start gap-2 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1 space-y-2">
                    {paint && <PaintChip paint={paint} size="sm" />}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Role
                        </label>
                        <select
                          {...register(`paints.${index}.role` as const)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {PAINT_ROLES.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Ratio (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="1:2, thin coat"
                          {...register(`paints.${index}.ratio` as const)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePaint(index)}
                    className="text-gray-400 hover:text-accent-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Paint Button */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Select role for new paint
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as PaintRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PAINT_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPaintSelector(true)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Paint
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1"
          >
            Save Recipe
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Paint Selector Modal */}
      {showPaintSelector && (
        <PaintSelectorModal
          selectedPaintIds={[]}
          onSelectionChange={handleAddPaint}
          onClose={() => setShowPaintSelector(false)}
          multiSelect={true}
        />
      )}
    </div>
  );
}
