'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArmyFormData, POPULAR_FACTIONS } from '@/types/army';
import { createArmy, updateArmy } from '@/lib/firestore/armies';
import { deleteField } from 'firebase/firestore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { ImageInput } from '@/components/ui/ImageInput';
import { Army } from '@/types/army';

const armyFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  faction: z.string().max(50, 'Faction must be less than 50 characters').optional(),
  tags: z.array(z.string()).optional(),
  customPhotoUrl: z.string().optional(),
});

interface ArmyFormProps {
  userId: string;
  editingArmy?: Army | null;
  onSuccess: (armyId: string) => void;
  onCancel?: () => void;
}

export function ArmyForm({ userId, editingArmy, onSuccess, onCancel }: ArmyFormProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<ArmyFormData>({
    resolver: zodResolver(armyFormSchema),
    defaultValues: {
      name: '',
      description: '',
      faction: '',
      tags: [],
      customPhotoUrl: '',
    },
  });

  useEffect(() => {
    if (editingArmy) {
      setValue('name', editingArmy.name);
      setValue('description', editingArmy.description || '');
      setValue('faction', editingArmy.faction || '');
      setValue('tags', editingArmy.tags || []);
      setValue('customPhotoUrl', editingArmy.customPhotoUrl || '');
    }
  }, [editingArmy, setValue]);

  async function onSubmit(data: ArmyFormData) {
    try {
      setError('');
      setIsLoading(true);

      let armyId: string;

      if (editingArmy) {
        // Update existing army
        const updates: any = {
          name: data.name,
          description: data.description || '',
          faction: data.faction || '',
          tags: data.tags || [],
        };

        if (data.customPhotoUrl) {
          updates.customPhotoUrl = data.customPhotoUrl;
        } else {
          // If empty string and we had one before (or to be safe), delete it
          updates.customPhotoUrl = deleteField();
        }

        await updateArmy(editingArmy.armyId, updates);
        armyId = editingArmy.armyId;
      } else {
        // Create new army
        const newArmyData: any = {
          ...data,
        };

        if (data.customPhotoUrl) {
          newArmyData.customPhotoUrl = data.customPhotoUrl;
        }

        armyId = await createArmy(userId, newArmyData);
      }

      onSuccess(armyId);
    } catch (err: any) {
      setError(editingArmy ? 'Failed to update army. Please try again.' : 'Failed to create army. Please try again.');
      console.error('Error saving army:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-accent-50 border border-accent-200 text-accent-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Army Name */}
        <Input
          label="Army Name"
          type="text"
          placeholder="Space Marine Chapter"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Faction */}
        <div>
          <label
            htmlFor="faction"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Faction (Optional)
          </label>
          <select
            id="faction"
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-primary-500 focus:ring-primary-500"
            {...register('faction')}
          >
            <option value="">Select a faction...</option>
            {POPULAR_FACTIONS.map((faction) => (
              <option key={faction} value={faction}>
                {faction}
              </option>
            ))}
          </select>
          {errors.faction && (
            <p className="mt-1.5 text-sm text-accent-600">{errors.faction.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe your army, theme, or paint scheme..."
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-primary-500 focus:ring-primary-500"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-accent-600">{errors.description.message}</p>
          )}
        </div>

        {/* Custom Cover Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Cover Photo (Optional)
          </label>
          <Controller
            name="customPhotoUrl"
            control={control}
            render={({ field }) => (
              <ImageInput
                value={field.value}
                onChange={field.onChange}
                label="Upload Cover"
                className="w-full"
              />
            )}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a group shot or leave empty to use a project photo.
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tags
          </label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TagInput
                tags={field.value || []}
                onChange={field.onChange}
                placeholder="Type tags like warhammer, ultramarines, tournament..."
              />
            )}
          />
          {errors.tags && (
            <p className="mt-1.5 text-sm text-accent-600">{errors.tags.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button type="submit" variant="default" className="flex-1" isLoading={isLoading}>
            {editingArmy ? 'Update Army' : 'Create Army'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
