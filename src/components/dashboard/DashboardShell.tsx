'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Sun,
  Moon,
  LogOut,
  Layers,
  Briefcase,
  Search,
  User,
  Menu,
  X,
} from 'lucide-react';
import LivingBackground from '@/components/ui/LivingBackground';
import { updateUserLocation } from '@/actions/settings';

interface DashboardShellProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  hasLocation?: boolean;
  children: React.ReactNode;
}

export default function DashboardShell({ user, hasLocation = false, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync theme class with HTML element
  useEffect(() => {
    const savedTheme = localStorage.getItem('muse_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkActive = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(darkActive);

    const root = document.documentElement;
    if (darkActive) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // One-time, best-effort location capture so daily capsule weather is real
  // for this person instead of the default fallback city. Silently no-ops if
  // the browser has no geolocation support or the person denies permission.
  useEffect(() => {
    if (hasLocation || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateUserLocation(position.coords.latitude, position.coords.longitude).catch(() => {});
      },
      () => {
        /* permission denied or unavailable — the default fallback city still works fine */
      },
      { timeout: 8000 }
    );
  }, [hasLocation]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const root = document.documentElement;
    if (nextDark) {
      root.classList.add('dark');
      localStorage.setItem('muse_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('muse_theme', 'light');
    }
  };

  // Four tabs, matching the product vision's IA (Home / Closet / Discover / Profile) —
  // keep this list in sync with what actually has a page.tsx under src/app/dashboard.
  const navItems = [
    { href: '/dashboard', label: 'Today', icon: Layers },
    { href: '/dashboard/closet', label: 'Wardrobe', icon: Briefcase },
    { href: '/dashboard/discover', label: 'Discover', icon: Search },
    { href: '/dashboard/profile', label: 'Style DNA', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="film-grain min-h-screen flex flex-col md:flex-row relative">
      <LivingBackground isDark={isDark} />

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-border/65 bg-card/60 backdrop-blur-md sticky top-0 z-[60] w-full">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <span className="text-white font-serif font-bold text-[10px] leading-none">M</span>
          </div>
          <span className="font-serif font-semibold text-base tracking-tight text-foreground">MUSE</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card/45 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card/45 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-64 border-r border-border bg-card/70 backdrop-blur-lg px-6 py-8 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } h-screen`}>
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-white font-serif font-bold text-sm leading-none">M</span>
              </div>
              <span className="font-serif font-semibold text-xl tracking-tight text-foreground">MUSE</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 rounded hover:bg-muted"
            >
              <X size={15} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                    active
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="space-y-4 pt-6 border-t border-border/40">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-accent/5 border border-accent/10 flex items-center justify-center text-accent">
              <User size={14} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-foreground truncate">
                {user.name || user.email.split('@')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-card/45 text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={handleSignOut}
              className="flex-1 w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-card/45 text-muted-foreground hover:text-foreground transition-colors"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT PORT */}
      <main className="flex-1 relative z-10 p-6 sm:p-10 max-w-5xl mx-auto w-full md:max-h-screen md:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
