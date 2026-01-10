'use client';

import { Army } from '@/types/army';
import { ArmyCard } from './ArmyCard';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface ArmyListProps {
  armies: Army[];
  coverPhotos?: Map<string, string>; // Map of armyId -> photo URL
  emptyMessage?: string;
  showCreateButton?: boolean;
}

export function ArmyList({
  armies,
  coverPhotos,
  emptyMessage = 'No armies yet',
  showCreateButton = true
}: ArmyListProps) {
  if (armies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {emptyMessage}
        </h3>
        {showCreateButton && (
          <Link
            href="/armies/new"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
          >
            <Plus className="w-4 h-4" />
            Create your first army
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {armies.map((army) => (
        <ArmyCard
          key={army.armyId}
          army={army}
          coverPhotoUrl={coverPhotos?.get(army.armyId)}
        />
      ))}
    </div>
  );
}
