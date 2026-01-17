import { getAdminAuth } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthResult {
    uid: string;
    email?: string;
    isAdmin: boolean;
    token: any;
}

/**
 * Verify Firebase ID Token from Authorization header
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult | null> {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await getAdminAuth().verifyIdToken(token);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            isAdmin: !!decodedToken.admin, // Custom claim 'admin'
            token: decodedToken,
        };
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return null;
    }
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
    return NextResponse.json(
        { success: false, error: message },
        { status: 401 }
    );
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse(message = 'Forbidden') {
    return NextResponse.json(
        { success: false, error: message },
        { status: 403 }
    );
}
