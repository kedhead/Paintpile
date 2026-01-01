'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pileItemSchema } from '@/lib/validation/schemas';
import { PileFormData, PileItem } from '@/types/pile';
import { addToPile, updatePileItem } from '@/lib/firestore/pile';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';
import { PILE_TYPES, PILE_STATUSES } from '@/lib/utils/constants';

interface PileItemFormProps {
  userId: string;
  editingItem?: PileItem | null;
  onClose: () => void;
}

export function PileItemForm({ userId, editingItem, onClose }: PileItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PileFormData>({
    resolver: zodResolver(pileItemSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      status: 'unpainted',
      type: 'warhammer',
      notes: '',
    },
  });

  useEffect(() => {
    if (editingItem) {
      setValue('name', editingItem.name);
      setValue('quantity', editingItem.quantity);
      setValue('status', editingItem.status);
      setValue('type', editingItem.type);
      setValue('notes', editingItem.notes || '');
    }
  }, [editingItem, setValue]);

  const onSubmit = async (data: PileFormData) => {
    try {
      setIsSubmitting(true);

      if (editingItem) {
        await updatePileItem(editingItem.pileId, userId, data);
      } else {
        await addToPile(userId, data);
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
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              id="type"
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {PILE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-accent-600">{errors.type.message}</p>
            )}
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
              {PILE_STATUSES.map((status) => (
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
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              placeholder="Any additional notes about this item..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-accent-600">{errors.notes.message}</p>
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
