'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ImageInputProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    label?: string;
}

export function ImageInput({ value, onChange, className, label = 'Upload Image' }: ImageInputProps) {
    const { currentUser } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be smaller than 10MB');
            return;
        }

        setError('');
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', currentUser?.uid || '');

            const response = await fetch('/api/upload/temp-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            onChange(data.url);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image');
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const clearImage = () => {
        onChange('');
        setError('');
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-lg overflow-hidden border border-border bg-muted">
                            <img
                                src={value}
                                alt="Uploaded preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={clearImage}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:bg-destructive/90 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remove image"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "w-32 h-32 rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50",
                            isUploading && "opacity-50 cursor-default"
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                            <>
                                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground text-center px-2">
                                    {label}
                                </span>
                            </>
                        )}
                    </div>
                )}

                <div className="flex-1 space-y-2">
                    {!value && (
                        <div className="text-sm text-muted-foreground">
                            <p>Supported: JPG, PNG, WEBP</p>
                            <p>Max size: 10MB</p>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
            />
        </div>
    );
}
