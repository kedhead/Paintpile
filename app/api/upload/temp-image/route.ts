import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/upload/temp-image
 *
 * Upload a temporary image for AI processing.
 * Images are stored in temp/ folder and can be cleaned up periodically.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    // Verify authentication
    const { verifyAuth, unauthorizedResponse } = await import('@/lib/auth/server-auth');
    const auth = await verifyAuth(request);

    if (!auth) {
      return unauthorizedResponse('You must be logged in to upload images');
    }

    if (auth.uid !== userId) {
      return unauthorizedResponse('User ID mismatch');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File must be smaller than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `temp/${userId}/${timestamp}-${randomString}.${extension}`;

    // Upload to Firebase Storage using Admin SDK
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const fileRef = bucket.file(filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload with public-read ACL
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=3600',
      },
      public: true,
    });

    // Also make public to ensure accessibility
    await fileRef.makePublic();

    // Get the public URL directly - this format is always accessible
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    console.log('[Temp Upload] File uploaded:', filename);
    console.log('[Temp Upload] Public URL:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filename,
    });
  } catch (error: any) {
    console.error('Error uploading temp image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
