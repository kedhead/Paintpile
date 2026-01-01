'use client';

import { useState, useEffect } from 'react';
import { Photo } from '@/types/photo';
import { Paint } from '@/types/paint';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { Trash2, X, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getPaintsByIds } from '@/lib/firestore/paints';
import { PaintChipList } from '@/components/paints/PaintChip';
import { PhotoAnnotator } from '@/components/annotations/PhotoAnnotator';

interface PhotoGalleryProps {
  photos: Photo[];
  projectId?: string;
  userId?: string;
  onDelete?: (photoId: string) => void;
  onPhotoUpdate?: () => void;
  canDelete?: boolean;
  canAnnotate?: boolean;
}

export function PhotoGallery({
  photos,
  projectId,
  userId,
  onDelete,
  onPhotoUpdate,
  canDelete = false,
  canAnnotate = false,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [annotatingPhoto, setAnnotatingPhoto] = useState<Photo | null>(null);
  const [photoPaints, setPhotoPaints] = useState<Record<string, Paint[]>>({});

  useEffect(() => {
    loadAllPaints();
  }, [photos]);

  async function loadAllPaints() {
    const paintsMap: Record<string, Paint[]> = {};

    for (const photo of photos) {
      if (photo.paintIds && photo.paintIds.length > 0) {
        const paints = await getPaintsByIds(photo.paintIds);
        paintsMap[photo.photoId] = paints;
      }
    }

    setPhotoPaints(paintsMap);
  }

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
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 rounded-b-lg">
              {photo.caption && (
                <p className="text-sm line-clamp-2 mb-1">{photo.caption}</p>
              )}
              {photoPaints[photo.photoId] && photoPaints[photo.photoId].length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {photoPaints[photo.photoId].slice(0, 3).map((paint) => (
                    <div
                      key={paint.paintId}
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: paint.hexColor }}
                      title={`${paint.brand} - ${paint.name}`}
                    />
                  ))}
                  {photoPaints[photo.photoId].length > 3 && (
                    <div className="text-xs flex items-center">
                      +{photoPaints[photo.photoId].length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
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
            <div className="bg-white rounded-lg p-4 mt-4 space-y-3">
              {selectedPhoto.caption && (
                <div>
                  <p className="text-gray-900">{selectedPhoto.caption}</p>
                </div>
              )}
              {photoPaints[selectedPhoto.photoId] && photoPaints[selectedPhoto.photoId].length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Paints Used ({photoPaints[selectedPhoto.photoId].length}):
                  </p>
                  <PaintChipList
                    paints={photoPaints[selectedPhoto.photoId]}
                    size="sm"
                  />
                </div>
              )}

              {/* Annotations info */}
              {selectedPhoto.annotations && selectedPhoto.annotations.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedPhoto.annotations.length} annotation{selectedPhoto.annotations.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {canAnnotate && projectId && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setAnnotatingPhoto(selectedPhoto);
                      setSelectedPhoto(null);
                    }}
                  >
                    <Palette className="h-4 w-4 mr-1" />
                    {selectedPhoto.annotations && selectedPhoto.annotations.length > 0 ? 'Edit' : 'Add'} Annotations
                  </Button>
                )}
              </div>

              <p className="text-sm text-gray-500">
                Uploaded {formatRelativeTime(selectedPhoto.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Annotator */}
      {annotatingPhoto && projectId && (
        <PhotoAnnotator
          photo={annotatingPhoto}
          projectId={projectId}
          userId={userId}
          onClose={() => setAnnotatingPhoto(null)}
          onUpdate={() => {
            if (onPhotoUpdate) {
              onPhotoUpdate();
            }
          }}
        />
      )}
    </>
  );
}
