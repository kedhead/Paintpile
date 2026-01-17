export function getShareUrl(platform: 'facebook' | 'twitter', url: string, text?: string) {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = text ? encodeURIComponent(text) : '';

    switch (platform) {
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        case 'twitter':
            return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        default:
            return url;
    }
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard', err);
        return false;
    }
}

export async function shareNative(data: ShareData): Promise<boolean> {
    if (navigator.share) {
        try {
            await navigator.share(data);
            return true;
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error('Error sharing', err);
            }
            return false;
        }
    }
    return false;
}
