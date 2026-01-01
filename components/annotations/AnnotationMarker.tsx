'use client';

import { useState, useRef, useEffect } from 'react';
import { PhotoAnnotation } from '@/types/photo';

interface AnnotationMarkerProps {
  annotation: PhotoAnnotation;
  isSelected: boolean;
  showLabel: boolean;
  isDraggable: boolean;
  containerWidth: number;
  containerHeight: number;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}

export function AnnotationMarker({
  annotation,
  isSelected,
  showLabel,
  isDraggable,
  containerWidth,
  containerHeight,
  onSelect,
  onMove,
}: AnnotationMarkerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const markerRef = useRef<HTMLDivElement>(null);

  // Calculate pixel position from percentage
  const pixelX = (annotation.x / 100) * containerWidth;
  const pixelY = (annotation.y / 100) * containerHeight;

  // Get color from first paint in annotation (if any)
  const getMarkerColor = () => {
    if (annotation.paints.length > 0) {
      // Use a hash of the annotation ID to generate a consistent color
      const hash = annotation.id.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      const hue = Math.abs(hash % 360);
      return `hsl(${hue}, 70%, 50%)`;
    }
    return '#3b82f6'; // Default blue
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) {
      onSelect();
      return;
    }

    e.stopPropagation();
    setIsDragging(true);

    const rect = markerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    onSelect();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!markerRef.current) return;

      const container = markerRef.current.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      // Convert to percentage
      const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));

      onMove(percentX, percentY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onMove]);

  return (
    <div
      ref={markerRef}
      className={`absolute flex items-center gap-2 ${
        isDraggable ? 'cursor-move' : 'cursor-pointer'
      } ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Marker Dot */}
      <div
        className={`w-6 h-6 rounded-full border-2 transition-all ${
          isSelected
            ? 'border-white shadow-lg scale-125'
            : 'border-white/80 shadow-md'
        }`}
        style={{ backgroundColor: getMarkerColor() }}
      />

      {/* Label */}
      {showLabel && annotation.label && (
        <div
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
            isSelected
              ? 'bg-white text-gray-900 shadow-lg'
              : 'bg-black/70 text-white'
          }`}
        >
          {annotation.label}
        </div>
      )}
    </div>
  );
}
