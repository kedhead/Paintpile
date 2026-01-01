'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { uploadProjectPhoto } from '@/lib/firebase/storage';
import { addPhotoToProject } from '@/lib/firestore/photos';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/utils/constants';
import { Upload, X, Paintbrush } from 'lucide-react';
import { PaintSelector } from '@/components/paints/PaintSelector';
import { Paint } from '@/types/paint';

interface PhotoUploadProps {
  userId: string;
  projectId: string;
  onUploadComplete: () => void;
}

interface PreviewFile {
  file: File;
  preview: string;
  progress: number;
  caption?: string;
  selectedPaints: Paint[];
  error?: string;
}

export function PhotoUpload({ userId, projectId, onUploadComplete }: PhotoUploadProps) {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [editingPaintsIndex, setEditingPaintsIndex] = useState<number | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      selectedPaints: [],
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    maxFiles: 10,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];

      try {
        // Generate unique photo ID
        const photoId = `photo_${Date.now()}_${i}`;

        // Get image dimensions
        const dimensions = await getImageDimensions(fileData.file);

        // Upload to storage
        const { url, thumbnailUrl } = await uploadProjectPhoto(
          userId,
          projectId,
          photoId,
          fileData.file,
          (progress) => {
            setFiles((prev) => {
              const newFiles = [...prev];
              newFiles[i] = { ...newFiles[i], progress };
              return newFiles;
            });
          }
        );

        // Add to Firestore
        await addPhotoToProject(userId, projectId, {
          url,
          thumbnailUrl,
          width: dimensions.width,
          height: dimensions.height,
          caption: fileData.caption,
          paintIds: fileData.selectedPaints.map((p) => p.paintId),
        });

        // Mark as complete
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], progress: 100 };
          return newFiles;
        });
      } catch (error) {
        console.error('Upload error:', error);
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], error: 'Upload failed' };
          return newFiles;
        });
      }
    }

    setIsUploading(false);

    // Clean up and notify parent
    setTimeout(() => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
      onUploadComplete();
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Drop images here...</p>
        ) : (
          <div>
            <p className="text-gray-700 font-medium mb-1">
              Drag & drop images here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, WEBP up to 5MB (max 10 photos)
            </p>
          </div>
        )}
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((fileData, index) => (
              <div key={index} className="relative group">
                <img
                  src={fileData.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {!isUploading && (
                  <>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-accent-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingPaintsIndex(index)}
                      className="absolute top-2 left-2 bg-primary-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Add paints"
                    >
                      <Paintbrush className="h-4 w-4" />
                    </button>
                    {fileData.selectedPaints.length > 0 && (
                      <div className="absolute bottom-2 left-2 bg-white rounded-full px-2 py-1 text-xs font-medium">
                        {fileData.selectedPaints.length} paint{fileData.selectedPaints.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </>
                )}
                {fileData.progress > 0 && fileData.progress < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 rounded-b-lg p-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${fileData.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {fileData.error && (
                  <div className="absolute inset-0 bg-accent-500 bg-opacity-90 rounded-lg flex items-center justify-center">
                    <p className="text-white text-sm font-medium">{fileData.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={uploadFiles}
              variant="primary"
              isLoading={isUploading}
              disabled={isUploading}
              className="flex-1"
            >
              Upload {files.length} {files.length === 1 ? 'Photo' : 'Photos'}
            </Button>
            {!isUploading && (
              <Button
                onClick={() => {
                  files.forEach((f) => URL.revokeObjectURL(f.preview));
                  setFiles([]);
                }}
                variant="ghost"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Paint Selector Modal */}
      {editingPaintsIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Paints for Photo {editingPaintsIndex + 1}
                </h3>
                <button
                  onClick={() => setEditingPaintsIndex(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <PaintSelector
                selectedPaints={files[editingPaintsIndex].selectedPaints}
                onPaintsChange={(paints) => {
                  setFiles((prev) => {
                    const newFiles = [...prev];
                    newFiles[editingPaintsIndex] = {
                      ...newFiles[editingPaintsIndex],
                      selectedPaints: paints,
                    };
                    return newFiles;
                  });
                }}
              />
            </div>
            <div className="p-6 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={() => setEditingPaintsIndex(null)}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}
