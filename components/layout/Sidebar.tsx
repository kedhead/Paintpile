'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Palette, BookOpen, Plus } from 'lucide-react';

interface SidebarProps {
  onNewProject?: () => void;
}

export function Sidebar({ onNewProject }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Gallery',
      href: '/dashboard',
      icon: LayoutGrid,
      current: pathname === '/dashboard' || pathname.startsWith('/projects'),
    },
    {
      name: 'Paint Library',
      href: '/paints',
      icon: Palette,
      current: pathname === '/paints',
    },
    {
      name: 'Journal',
      href: '/journal',
      icon: BookOpen,
      current: pathname === '/journal',
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="block">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">
                PAINTPILE
              </h1>
              <p className="text-xs text-muted-foreground">Painting Journal</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                item.current
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${item.current ? 'text-primary' : ''}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* New Project Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>
    </div>
  );
}
