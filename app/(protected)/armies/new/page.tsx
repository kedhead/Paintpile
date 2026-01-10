'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArmyForm } from '@/components/armies/ArmyForm';

export default function NewArmyPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  function handleSuccess(armyId: string) {
    router.push(`/armies/${armyId}`);
  }

  function handleCancel() {
    router.push('/armies');
  }

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Army</CardTitle>
        </CardHeader>
        <CardContent>
          <ArmyForm
            userId={currentUser.uid}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
