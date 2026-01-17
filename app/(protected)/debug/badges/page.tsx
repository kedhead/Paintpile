'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function DebugBadgesPage() {
    const [badges, setBadges] = useState<any[]>([]);

    useEffect(() => {
        async function loadBadges() {
            const snap = await getDocs(collection(db, 'badges'));
            setBadges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        loadBadges();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Badge Debugger</h1>
            <table className="min-w-full border">
                <thead>
                    <tr>
                        <th className="border p-2">ID</th>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Description</th>
                    </tr>
                </thead>
                <tbody>
                    {badges.map(b => (
                        <tr key={b.id}>
                            <td className="border p-2 font-mono">{b.id}</td>
                            <td className="border p-2">{b.name}</td>
                            <td className="border p-2">{b.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
