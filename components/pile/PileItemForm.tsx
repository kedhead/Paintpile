'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormData } from '@/lib/validation/schemas';
import { Project } from '@/types/project';
import { createProject, updateProject } from '@/lib/firestore/projects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { X } from 'lucide-react';
import { PROJECT_STATUSES, TAG_SHAME } from '@/lib/utils/constants';

interface PileItemFormProps {
  userId: string;
  editingItem?: Project | null;
  onClose: () => void;
}

export function PileItemForm({ userId, editingItem, onClose }: PileItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      status: 'not-started',
      tags: [TAG_SHAME],
      description: '',
    },
  });

  useEffect(() => {
    if (editingItem) {
      setValue('name', editingItem.name);
      setValue('quantity', editingItem.quantity || 1);
      setValue('status', editingItem.status);
      setValue('tags', editingItem.tags || [TAG_SHAME]);
      setValue('description', editingItem.description || '');
    }
  }, [editingItem, setValue]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setIsSubmitting(true);

      // Ensure 'shame' tag is always included
      const tags = [...(data.tags || [])];
      if (!tags.includes(TAG_SHAME)) {
        tags.unshift(TAG_SHAME);
      }

      // Extract only the fields we need (exclude startDate since pile form doesn't use it)
      const projectData = {
        name: data.name,
        description: data.description,
        status: data.status,
        quantity: data.quantity,
        tags,
      };

      if (editingItem) {
        await updateProject(editingItem.projectId, projectData);
      } else {
        await createProject(userId, projectData);
      }

      onClose();
    } catch (err) {
      console.error('Error saving pile item:', err);
      alert('Failed to save pile item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingItem ? 'Edit Pile Item' : 'Add to Pile'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Space Marine Intercessors"
              error={errors.name?.message}
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <Input
              id="quantity"
              type="number"
              min="1"
              {...register('quantity', { valueAsNumber: true })}
              error={errors.quantity?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagInput
                  tags={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add tags like warhammer, infantry... (shame tag is automatic)"
                />
              )}
            />
            {errors.tags && (
              <p className="mt-1 text-sm text-accent-600">{errors.tags.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">The 'shame' tag will be added automatically</p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-accent-600">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Any additional notes about this item..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-accent-600">{errors.description.message}</p>
            )}
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
              {editingItem ? 'Save Changes' : 'Add to Pile'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
