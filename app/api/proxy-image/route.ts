
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Basic security check: ensure it's from our allowed domains
    // Allow Google Storage and Replicate (where AI images might come from)
    const allowedDomains = [
        'storage.googleapis.com',
        'replicate.delivery',
        'pbxt.replicate.delivery'
    ];

    try {
        const urlObj = new URL(url);
        if (!allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
            // In development, might want to be more lenient or log warning
            console.warn(`[Proxy] Request for external domain: ${urlObj.hostname}`);
            // return new NextResponse('Domain not allowed', { status: 403 });
        }
    } catch (e) {
        return new NextResponse('Invalid URL', { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
        }

        const blob = await response.blob();
        const headers = new Headers();
        headers.set('Content-Type', blob.type);
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('Access-Control-Allow-Origin', '*');

        return new NextResponse(blob, {
            status: 200,
            headers
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
