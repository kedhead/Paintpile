export function getApiBaseUrl(): string {
    // If we are in the mobile app (Capacitor), point to production
    // We can detect Capacitor via window.Capacitor, or just use an env var
    // For this branch, we know we are building for mobile or static export.
    if (process.env.NEXT_PUBLIC_IS_MOBILE_APP === 'true' || typeof window !== 'undefined' && window.location.protocol === 'file:') {
        return 'https://www.paintpile.com';
    }

    // Default to relative path for web
    return '';
}

export function getApiUrl(path: string): string {
    const base = getApiBaseUrl();
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
}
