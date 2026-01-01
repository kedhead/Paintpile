'use client';

import { TimelineEvent as TimelineEventType, TIMELINE_EVENT_LABELS } from '@/types/timeline';
import { formatRelativeTime } from '@/lib/utils/formatters';
import {
  Palette,
  Image,
  Paintbrush,
  BookOpen,
  AlertCircle,
  FolderPlus,
  Edit,
  Tag,
} from 'lucide-react';

interface TimelineEventProps {
  event: TimelineEventType;
}

export function TimelineEvent({ event }: TimelineEventProps) {
  // Get icon for event type
  function getEventIcon() {
    const iconClass = 'h-5 w-5';

    switch (event.type) {
      case 'project_created':
        return <FolderPlus className={iconClass} />;
      case 'project_updated':
        return <Edit className={iconClass} />;
      case 'photo_added':
        return <Image className={iconClass} />;
      case 'paint_added':
        return <Paintbrush className={iconClass} />;
      case 'recipe_created':
      case 'recipe_updated':
        return <Palette className={iconClass} />;
      case 'technique_added':
        return <BookOpen className={iconClass} />;
      case 'status_changed':
        return <AlertCircle className={iconClass} />;
      case 'annotation_added':
        return <Tag className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  }

  // Get color for event type
  function getEventColor() {
    switch (event.type) {
      case 'project_created':
        return 'bg-green-100 text-green-700';
      case 'photo_added':
        return 'bg-blue-100 text-blue-700';
      case 'paint_added':
        return 'bg-purple-100 text-purple-700';
      case 'recipe_created':
      case 'recipe_updated':
        return 'bg-pink-100 text-pink-700';
      case 'technique_added':
        return 'bg-orange-100 text-orange-700';
      case 'status_changed':
        return 'bg-yellow-100 text-yellow-700';
      case 'annotation_added':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  // Get description for event
  function getEventDescription() {
    const { metadata } = event;

    switch (event.type) {
      case 'project_created':
        return 'Project created';

      case 'project_updated':
        return metadata.description || 'Project updated';

      case 'photo_added':
        return metadata.photoCaption
          ? `Added photo: ${metadata.photoCaption}`
          : 'Added a new photo';

      case 'paint_added':
        return metadata.paintName && metadata.paintBrand
          ? `Added ${metadata.paintBrand} - ${metadata.paintName}`
          : 'Added a paint to the project';

      case 'recipe_created':
        return metadata.recipeName
          ? `Created recipe: ${metadata.recipeName}`
          : 'Created a paint recipe';

      case 'recipe_updated':
        return metadata.recipeName
          ? `Updated recipe: ${metadata.recipeName}`
          : 'Updated a paint recipe';

      case 'technique_added':
        return metadata.techniqueName
          ? `Added technique: ${metadata.techniqueName}`
          : 'Added a painting technique';

      case 'status_changed':
        return metadata.oldStatus && metadata.newStatus
          ? `Status changed from ${metadata.oldStatus} to ${metadata.newStatus}`
          : 'Project status changed';

      case 'annotation_added':
        return 'Added photo annotation';

      default:
        return TIMELINE_EVENT_LABELS[event.type] || 'Unknown event';
    }
  }

  return (
    <div className="flex gap-4 pb-6 last:pb-0">
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getEventColor()}`}>
        {getEventIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {getEventDescription()}
              </p>

              {/* Additional metadata */}
              {event.metadata.recipeDescription && (
                <p className="text-sm text-gray-600 mt-1">
                  {event.metadata.recipeDescription}
                </p>
              )}

              {event.metadata.techniqueCategory && (
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                    {event.metadata.techniqueCategory}
                  </span>
                </div>
              )}
            </div>

            <time className="text-xs text-gray-500 whitespace-nowrap">
              {formatRelativeTime(event.timestamp)}
            </time>
          </div>

          {/* Photo thumbnail */}
          {event.type === 'photo_added' && event.metadata.photoUrl && (
            <div className="mt-3">
              <img
                src={event.metadata.photoUrl}
                alt={event.metadata.photoCaption || 'Photo'}
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
