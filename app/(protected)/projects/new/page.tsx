'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { projectSchema, type ProjectFormData } from '@/lib/validation/schemas';
import { createProject } from '@/lib/firestore/projects';
import { getUserArmies, addProjectToArmy } from '@/lib/firestore/armies';
import { Army } from '@/types/army';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { PROJECT_STATUSES } from '@/lib/utils/constants';
import { Shield } from 'lucide-react';

export default function NewProjectPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [armies, setArmies] = useState<Army[]>([]);
  const [selectedArmyIds, setSelectedArmyIds] = useState<string[]>([]);
  const router = useRouter();
  const { currentUser } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'not-started',
      quantity: 1,
      tags: [],
    },
  });

  // Load user's armies
  useEffect(() => {
    async function loadArmies() {
      if (!currentUser) return;

      try {
        const userArmies = await getUserArmies(currentUser.uid);
        setArmies(userArmies);
      } catch (err) {
        console.error('Error loading armies:', err);
      }
    }

    loadArmies();
  }, [currentUser]);

  async function onSubmit(data: ProjectFormData) {
    if (!currentUser) {
      setError('You must be logged in to create a project');
      return;
    }

    try {
      setError('');
      setIsLoading(true);

      const projectId = await createProject(currentUser.uid, data);

      // Add project to selected armies
      if (selectedArmyIds.length > 0) {
        await Promise.all(
          selectedArmyIds.map(armyId => addProjectToArmy(armyId, projectId))
        );
      }

      // Redirect to the new project page
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      setError('Failed to create project. Please try again.');
      console.error('Error creating project:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 pb-32 md:pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-accent-50 border border-accent-200 text-accent-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Name */}
            <Input
              label="Project Name"
              type="text"
              placeholder="Space Marine Squad"
              error={errors.name?.message}
              {...register('name')}
            />

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
                placeholder="Describe your project, techniques you're using, or goals..."
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-primary-500 focus:ring-primary-500"
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1.5 text-sm text-accent-600">{errors.description.message}</p>
              )}
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
                    placeholder="Type tags like warhammer, commission, infantry..."
                  />
                )}
              />
              {errors.tags && (
                <p className="mt-1.5 text-sm text-accent-600">{errors.tags.message}</p>
              )}
            </div>

            {/* Quantity */}
            <Input
              label="Quantity (Optional)"
              type="number"
              placeholder="1"
              error={errors.quantity?.message}
              {...register('quantity', {
                setValueAs: (value) => (value ? parseInt(value, 10) : 1),
              })}
            />

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Status
              </label>
              <select
                id="status"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-primary-500 focus:ring-primary-500"
                {...register('status')}
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1.5 text-sm text-accent-600">{errors.status.message}</p>
              )}
            </div>

            {/* Start Date */}
            <Input
              label="Start Date (Optional)"
              type="date"
              error={errors.startDate?.message}
              {...register('startDate', {
                setValueAs: (value) => (value ? new Date(value) : undefined),
              })}
            />

            {/* Add to Armies */}
            {armies.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add to Armies (Optional)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {armies.map((army) => (
                    <label
                      key={army.armyId}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedArmyIds.includes(army.armyId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedArmyIds([...selectedArmyIds, army.armyId]);
                          } else {
                            setSelectedArmyIds(selectedArmyIds.filter(id => id !== army.armyId));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <Shield className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {army.name}
                        </div>
                        {army.faction && (
                          <div className="text-xs text-gray-500">
                            {army.faction}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {army.projectIds.length} {army.projectIds.length === 1 ? 'project' : 'projects'}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Select which armies this project belongs to. You can also add it to armies later.
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-4">
              <Button type="submit" variant="default" className="flex-1" isLoading={isLoading}>
                Create Project
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
