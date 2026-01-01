'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  function handleNewProject() {
    router.push('/projects/new');
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onNewProject={handleNewProject} />
      <main className="pl-64">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
