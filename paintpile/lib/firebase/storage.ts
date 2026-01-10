import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from './firebase';
import imageCompression from 'browser-image-compression';

/**
 * Compress an image file before upload
 */
export async function compressImage(file: File, maxWidth: number = 1920): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: maxWidth,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    return file; // Return original if compression fails
  }
}

/**
 * Upload a profile photo
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const compressedFile = await compressImage(file, 400);
  const fileName = `profile_${Date.now()}.jpg`;
  const storageRef = ref(storage, `users/${userId}/profile/${fileName}`);

  const uploadTask = uploadBytesResumable(storageRef, compressedFile);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

/**
 * Upload a project photo (full size and thumbnail)
 */
export async function uploadProjectPhoto(
  userId: string,
  projectId: string,
  photoId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; thumbnailUrl: string }> {
  // Upload full size (compressed to 1920px)
  const compressedFile = await compressImage(file, 1920);
  const fullFileName = `${photoId}_full.jpg`;
  const fullRef = ref(storage, `users/${userId}/projects/${projectId}/photos/${photoId}/${fullFileName}`);

  // Upload thumbnail (400px)
  const thumbnailFile = await compressImage(file, 400);
  const thumbnailFileName = `${photoId}_thumb.jpg`;
  const thumbnailRef = ref(storage, `users/${userId}/projects/${projectId}/photos/${photoId}/${thumbnailFileName}`);

  // Upload both in parallel
  const [fullTask, thumbTask] = [
    uploadBytesResumable(fullRef, compressedFile),
    uploadBytesResumable(thumbnailRef, thumbnailFile),
  ];

  return new Promise((resolve, reject) => {
    let fullProgress = 0;
    let thumbProgress = 0;

    fullTask.on('state_changed', (snapshot: UploadTaskSnapshot) => {
      fullProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 50;
      if (onProgress) {
        onProgress(fullProgress + thumbProgress);
      }
    });

    thumbTask.on('state_changed', (snapshot: UploadTaskSnapshot) => {
      thumbProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 50;
      if (onProgress) {
        onProgress(fullProgress + thumbProgress);
      }
    });

    Promise.all([
      new Promise<string>((res, rej) => {
        fullTask.on('state_changed', null, rej, async () => {
          const url = await getDownloadURL(fullTask.snapshot.ref);
          res(url);
        });
      }),
      new Promise<string>((res, rej) => {
        thumbTask.on('state_changed', null, rej, async () => {
          const url = await getDownloadURL(thumbTask.snapshot.ref);
          res(url);
        });
      }),
    ])
      .then(([url, thumbnailUrl]) => {
        resolve({ url, thumbnailUrl });
      })
      .catch(reject);
  });
}

/**
 * Delete a photo from storage
 */
export async function deletePhoto(userId: string, projectId: string, photoId: string): Promise<void> {
  const fullRef = ref(storage, `users/${userId}/projects/${projectId}/photos/${photoId}/${photoId}_full.jpg`);
  const thumbnailRef = ref(storage, `users/${userId}/projects/${projectId}/photos/${photoId}/${photoId}_thumb.jpg`);

  try {
    await Promise.all([deleteObject(fullRef), deleteObject(thumbnailRef)]);
  } catch (error) {
    console.error('Error deleting photo:', error);
    // Continue even if delete fails (file might not exist)
  }
}

/**
 * Delete profile photo
 */
export async function deleteProfilePhoto(path: string): Promise<void> {
  const photoRef = ref(storage, path);
  await deleteObject(photoRef);
}
