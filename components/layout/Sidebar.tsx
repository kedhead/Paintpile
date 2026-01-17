'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Palette, Book, PlusCircle, LogOut, Users, ChefHat, BookOpen, Shield, Rss, FlaskConical, Camera, Zap } from 'lucide-react';
import { SidebarAd } from '@/components/ads/SidebarAd';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

interface SidebarProps {
  onNewProject?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose, onNewProject }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  async function handleSignOut() {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }

  const navigation = [
    {
      name: 'My Gallery',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard' || pathname.startsWith('/projects'),
    },
    {
      name: 'My Armies',
      href: '/armies',
      icon: Shield,
      current: pathname === '/armies' || pathname.startsWith('/armies'),
    },
    {
      name: 'Following Feed',
      href: '/feed',
      icon: Rss,
      current: pathname === '/feed',
    },
    {
      name: 'Community',
      href: '/gallery',
      icon: Users,
      current: pathname === '/gallery',
    },
    {
      name: 'Paint Library',
      href: '/paints',
      icon: Palette,
      current: pathname === '/paints',
    },
    {
      name: 'My Recipes',
      href: '/recipes',
      icon: ChefHat,
      current: pathname === '/recipes' && !pathname.startsWith('/recipes/browse'),
    },
    {
      name: 'Browse Recipes',
      href: '/recipes/browse',
      icon: BookOpen,
      current: pathname.startsWith('/recipes/browse'),
    },
    {
      name: 'Smart Mixer',
      href: '/tools/paint-mixer',
      icon: FlaskConical,
      current: pathname.startsWith('/tools/paint-mixer'),
    },
    {
      name: 'Snap & Match',
      href: '/tools/color-match',
      icon: Camera,
      current: pathname.startsWith('/tools/color-match'),
    },
    {
      name: 'Paint Diary',
      href: '/diary',
      icon: Book,
      current: pathname.startsWith('/diary'),
    },
    {
      name: 'Features',
      href: '/features',
      icon: Zap,
      current: pathname.startsWith('/features'),
    },
    {
      name: "What's New",
      href: '/news',
      icon: Rss,
      current: pathname.startsWith('/news'),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-6">
          <Link href="/dashboard" className="block group transition-transform hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img
                  src="/paintpile-logo.png"
                  alt="PaintPile Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-display font-bold tracking-wider text-sidebar-primary leading-none">
                  PAINTPILE
                </h1>
                <p className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase">
                  Painting Journal
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group ${item.current
                  ? 'bg-sidebar-accent text-sidebar-primary border-r-2 border-sidebar-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                  }`}
              >
                <Icon
                  className={`w-5 h-5 ${item.current ? 'text-sidebar-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <SidebarAd />

        {/* User Profile & Actions */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          {/* User Info */}
          {/* User Info */}
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="text-primary font-semibold">
                {currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium truncate">
                {currentUser?.displayName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                View Profile
              </p>
            </div>
          </Link>

          {/* New Project Button */}
          <button
            onClick={onNewProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md font-semibold transition-all shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_20px_-3px_hsl(var(--primary)/0.5)] hover:bg-primary/90"
          >
            <PlusCircle className="w-5 h-5" />
            New Project
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
