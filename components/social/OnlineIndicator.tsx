import { Timestamp } from 'firebase/firestore';

interface OnlineIndicatorProps {
    lastActiveAt?: Timestamp;
    showLabel?: boolean;
}

export function OnlineIndicator({ lastActiveAt, showLabel = false }: OnlineIndicatorProps) {
    if (!lastActiveAt) return null;

    const now = new Date();
    const lastActive = lastActiveAt.toDate();
    const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

    // Consider online if active within last 5 minutes
    const isOnline = diffMinutes <= 5;

    if (!isOnline) return null;

    if (showLabel) {
        return (
            <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online
            </div>
        );
    }

    return (
        <span
            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"
            title="Online now"
        />
    );
}
