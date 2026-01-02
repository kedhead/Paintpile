'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createCustomPaint } from '@/lib/firestore/custom-paints';
import { PaintType } from '@/types/paint';
import { Plus, X } from 'lucide-react';

interface AddCustomPaintDialogProps {
  userId: string;
  onPaintAdded?: () => void;
}

export function AddCustomPaintDialog({ userId, onPaintAdded }: AddCustomPaintDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [hexColor, setHexColor] = useState('#000000');
  const [type, setType] = useState<PaintType>('base');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!brand.trim() || !name.trim()) {
      alert('Please enter both brand and paint name');
      return;
    }

    try {
      setLoading(true);
      await createCustomPaint(userId, brand.trim(), name.trim(), hexColor, type);

      // Reset form
      setBrand('');
      setName('');
      setHexColor('#000000');
      setType('base');
      setIsOpen(false);

      if (onPaintAdded) {
        onPaintAdded();
      }
    } catch (error) {
      console.error('Error creating custom paint:', error);
      alert('Failed to create custom paint');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Custom Paint
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Add Custom Paint</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Brand *
            </label>
            <Input
              type="text"
              placeholder="e.g., Citadel, Vallejo, Custom"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
          </div>

          {/* Paint Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Paint Name *
            </label>
            <Input
              type="text"
              placeholder="e.g., My Custom Red"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Color
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={hexColor}
                onChange={(e) => setHexColor(e.target.value)}
                className="h-12 w-20 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                type="text"
                value={hexColor}
                onChange={(e) => setHexColor(e.target.value)}
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a color or enter a hex code (e.g., #FF5733)
            </p>
          </div>

          {/* Paint Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type
            </label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as PaintType)}
              className="w-full"
            >
              <option value="base">Base</option>
              <option value="layer">Layer</option>
              <option value="shade">Shade/Wash</option>
              <option value="metallic">Metallic</option>
              <option value="contrast">Contrast/Speedpaint</option>
              <option value="technical">Technical</option>
            </Select>
          </div>

          {/* Preview */}
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded border border-border"
                style={{ backgroundColor: hexColor }}
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {name || 'Paint Name'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {brand || 'Brand'} • {type}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Paint'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
