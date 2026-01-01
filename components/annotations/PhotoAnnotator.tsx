'use client';

import { useState, useRef, useEffect } from 'react';
import { Photo, PhotoAnnotation } from '@/types/photo';
import { AnnotationMarker } from './AnnotationMarker';
import { AnnotationPanel } from './AnnotationPanel';
import { Button } from '@/components/ui/Button';
import { X, Eye, EyeOff, Move, Plus } from 'lucide-react';
import {
  addAnnotationToPhoto,
  updateAnnotation,
  deleteAnnotation,
  moveAnnotation,
} from '@/lib/firestore/photos';

interface PhotoAnnotatorProps {
  photo: Photo;
  projectId: string;
  userId?: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function PhotoAnnotator({
  photo,
  projectId,
  userId,
  onClose,
  onUpdate,
}: PhotoAnnotatorProps) {
  const [annotations, setAnnotations] = useState<PhotoAnnotation[]>(photo.annotations || []);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [isDraggable, setIsDraggable] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  function updateContainerSize() {
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isAdding || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newAnnotation: PhotoAnnotation = {
      id: crypto.randomUUID(),
      x,
      y,
      label: `Area ${annotations.length + 1}`,
      paints: [],
    };

    handleAddAnnotation(newAnnotation);
    setIsAdding(false);
  }

  async function handleAddAnnotation(annotation: PhotoAnnotation) {
    try {
      await addAnnotationToPhoto(projectId, photo.photoId, annotation, userId);
      setAnnotations([...annotations, annotation]);
      setSelectedAnnotationId(annotation.id);
      onUpdate();
    } catch (err) {
      console.error('Error adding annotation:', err);
      alert('Failed to add annotation');
    }
  }

  async function handleUpdateAnnotation(updatedAnnotation: PhotoAnnotation) {
    try {
      await updateAnnotation(
        projectId,
        photo.photoId,
        updatedAnnotation.id,
        updatedAnnotation
      );
      setAnnotations(
        annotations.map((ann) =>
          ann.id === updatedAnnotation.id ? updatedAnnotation : ann
        )
      );
      onUpdate();
    } catch (err) {
      console.error('Error updating annotation:', err);
      alert('Failed to update annotation');
    }
  }

  async function handleDeleteAnnotation() {
    if (!selectedAnnotationId) return;

    try {
      await deleteAnnotation(projectId, photo.photoId, selectedAnnotationId);
      setAnnotations(annotations.filter((ann) => ann.id !== selectedAnnotationId));
      setSelectedAnnotationId(null);
      onUpdate();
    } catch (err) {
      console.error('Error deleting annotation:', err);
      alert('Failed to delete annotation');
    }
  }

  async function handleMoveAnnotation(annotationId: string, x: number, y: number) {
    try {
      await moveAnnotation(projectId, photo.photoId, annotationId, x, y);
      setAnnotations(
        annotations.map((ann) => (ann.id === annotationId ? { ...ann, x, y } : ann))
      );
      onUpdate();
    } catch (err) {
      console.error('Error moving annotation:', err);
    }
  }

  const selectedAnnotation = annotations.find((ann) => ann.id === selectedAnnotationId) || null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-7xl flex gap-4">
        {/* Left side - Photo with annotations */}
        <div className="flex-1 flex flex-col bg-gray-900 rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isAdding ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setIsAdding(!isAdding);
                  setIsDraggable(false);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isAdding ? 'Click to Add' : 'Add Annotation'}
              </Button>

              <Button
                variant={isDraggable ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setIsDraggable(!isDraggable);
                  setIsAdding(false);
                }}
              >
                <Move className="h-4 w-4 mr-1" />
                {isDraggable ? 'Moving' : 'Move Markers'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
              >
                {showLabels ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide Labels
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Show Labels
                  </>
                )}
              </Button>

              <span className="text-sm text-gray-400 ml-2">
                {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>

          {/* Photo Container */}
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
            <div
              ref={imageContainerRef}
              className={`relative ${isAdding ? 'cursor-crosshair' : ''}`}
              onClick={handleImageClick}
            >
              <img
                ref={imageRef}
                src={photo.url}
                alt={photo.caption || 'Photo'}
                className="max-w-full max-h-full object-contain"
                onLoad={updateContainerSize}
              />

              {/* Annotation Markers */}
              {annotations.map((annotation) => (
                <AnnotationMarker
                  key={annotation.id}
                  annotation={annotation}
                  isSelected={annotation.id === selectedAnnotationId}
                  showLabel={showLabels}
                  isDraggable={isDraggable}
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                  onSelect={() => setSelectedAnnotationId(annotation.id)}
                  onMove={(x, y) => handleMoveAnnotation(annotation.id, x, y)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Annotation Panel */}
        <div className="w-96 flex-shrink-0">
          <AnnotationPanel
            annotation={selectedAnnotation}
            onUpdate={handleUpdateAnnotation}
            onDelete={handleDeleteAnnotation}
            onClose={() => setSelectedAnnotationId(null)}
          />
        </div>
      </div>
    </div>
  );
}
