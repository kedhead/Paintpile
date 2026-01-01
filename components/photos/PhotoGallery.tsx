'use client';

import { useState } from 'react';
import { Photo } from '@/types/photo';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: string) => void;
  canDelete?: boolean;
}

export function PhotoGallery({ photos, onDelete, canDelete = false }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No photos yet</p>
        <p className="text-sm mt-2">Upload your first progress photo to get started!</p>
      </div>
    );
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.photoId}
            className="relative group cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.thumbnailUrl}
              alt={photo.caption || 'Project photo'}
              className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
            />
            {canDelete && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this photo?')) {
                    onDelete(photo.photoId);
                  }
                }}
                className="absolute top-2 right-2 bg-accent-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 rounded-b-lg">
                <p className="text-sm line-clamp-2">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Project photo'}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            {selectedPhoto.caption && (
              <div className="bg-white rounded-lg p-4 mt-4">
                <p className="text-gray-900">{selectedPhoto.caption}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Uploaded {formatRelativeTime(selectedPhoto.createdAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
