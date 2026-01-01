'use client';

import { useState } from 'react';
import { seedPaintDatabase, getAllPaints } from '@/lib/firestore/paints';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function SeedPage() {
  const { currentUser } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [paintCount, setPaintCount] = useState<number | null>(null);

  async function handleSeed() {
    try {
      setIsSeeding(true);
      setMessage('Seeding paint database...');

      const count = await seedPaintDatabase();

      setMessage(`✅ Successfully seeded ${count} paints!`);
      setTimeout(() => checkPaintCount(), 1000);
    } catch (err) {
      console.error('Error seeding database:', err);
      setMessage('❌ Error seeding database. Check console for details.');
    } finally {
      setIsSeeding(false);
    }
  }

  async function checkPaintCount() {
    try {
      const paints = await getAllPaints();
      setPaintCount(paints.length);
    } catch (err) {
      console.error('Error checking paint count:', err);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Admin: Seed Paint Database</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> This will add 83 paints to the global paint database.
              Only run this once during initial setup.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              This will seed the database with paints from:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Citadel (40 paints)</li>
              <li>Vallejo Model Color (20 paints)</li>
              <li>Army Painter (10 paints)</li>
              <li>Reaper MSP (8 paints)</li>
              <li>P3 (5 paints)</li>
            </ul>
          </div>

          {paintCount !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Current paint count in database: <strong>{paintCount}</strong>
              </p>
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleSeed}
            isLoading={isSeeding}
            disabled={isSeeding}
            className="w-full"
          >
            {isSeeding ? 'Seeding Database...' : 'Seed Paint Database'}
          </Button>

          <Button
            variant="ghost"
            onClick={checkPaintCount}
            className="w-full"
          >
            Check Current Paint Count
          </Button>

          {message && (
            <div className={`rounded-lg p-4 ${
              message.includes('✅')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : message.includes('❌')
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-gray-50 border border-gray-200 text-gray-800'
            }`}>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Logged in as: {currentUser?.email}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
