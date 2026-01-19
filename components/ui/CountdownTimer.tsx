'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { differenceInSeconds, formatDuration, intervalToDuration } from 'date-fns';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    targetDate: Timestamp;
    onExpire?: () => void;
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<Duration | null>(null);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const target = targetDate.toDate();

        const tick = () => {
            const now = new Date();
            const diff = differenceInSeconds(target, now);

            if (diff <= 0) {
                setExpired(true);
                setTimeLeft(null);
                if (onExpire) onExpire();
                return;
            }

            const duration = intervalToDuration({ start: now, end: target });
            setTimeLeft(duration);
        };

        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [targetDate, onExpire]);

    if (expired) {
        return <span className="text-red-500 font-bold">Ended</span>;
    }

    if (!timeLeft) return null;

    // Helper to pad zeros
    const pad = (n: number | undefined) => n?.toString().padStart(2, '0') || '00';

    return (
        <div className="flex items-center gap-1 font-mono text-lg font-bold text-primary">
            <Clock className="w-4 h-4 mr-1" />
            <div className="flex items-center gap-0.5">
                {timeLeft.days ? <span>{timeLeft.days}d</span> : null}
                <span className="bg-muted px-1 rounded">{pad(timeLeft.hours)}</span>
                <span>:</span>
                <span className="bg-muted px-1 rounded">{pad(timeLeft.minutes)}</span>
                <span>:</span>
                <span className="bg-muted px-1 rounded">{pad(timeLeft.seconds)}</span>
            </div>
        </div>
    );
}
