'use client';

import { useState, useRef, useEffect } from 'react';
import { PhotoAnnotation } from '@/types/photo';

interface AnnotationMarkerProps {
  annotation: PhotoAnnotation;
  index: number;                    // Display number (1, 2, 3...)
  markerColor?: string;             // Optional hex color from paint
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
  index,
  markerColor,
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

  // Get marker color - use provided color or generate from hash
  const getMarkerColor = () => {
    if (markerColor) return markerColor;

    // Fallback: generate consistent color from annotation ID
    const hash = annotation.id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Determine text color based on background brightness
  const getTextColor = (bgColor: string) => {
    // Simple check - if color looks dark, use white text
    if (bgColor.startsWith('#')) {
      const hex = bgColor.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#ffffff';
    }
    return '#ffffff'; // Default to white for HSL colors
  };

  const bgColor = getMarkerColor();
  const textColor = getTextColor(bgColor);

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
      className={`absolute flex items-center gap-1 ${isDraggable ? 'cursor-move' : 'cursor-pointer'
        } ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Numbered Badge - Pentagon/Hexagon style like reference */}
      <div
        className={`relative flex items-center justify-center transition-all ${isSelected ? 'scale-125' : ''
          }`}
      >
        {/* Pentagon shape using clip-path */}
        <div
          className={`w-7 h-7 flex items-center justify-center font-bold text-sm shadow-lg border-2 ${isSelected ? 'border-white' : 'border-white/60'
            }`}
          style={{
            backgroundColor: bgColor,
            color: textColor,
            clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
          }}
        >
          {index}
        </div>
      </div>

      {/* Optional Label (for editing mode) */}
      {showLabel && annotation.label && (
        <div
          className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap transition-all ${isSelected
              ? 'bg-white text-gray-900 shadow-lg'
              : 'bg-black/80 text-white'
            }`}
        >
          {annotation.label}
        </div>
      )}
    </div>
  );
}

