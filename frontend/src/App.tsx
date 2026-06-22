import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from './store/useStore';
import LivingBackground from './components/LivingBackground';
import AuthScreen from './components/AuthScreen';
import DailyCapsule from './components/DailyCapsule';
import ClosetGrid from './components/ClosetGrid';
import DiscoverInsights from './components/DiscoverInsights';
import ProfileDNA from './components/ProfileDNA';
import { Sun, Moon, LogOut, Layers, Briefcase, Search, User } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});

const NAV_ITEMS = [
  { id: 'today'   as const, label: 'Today',    icon: Layers },
  { id: 'closet'  as const, label: 'Wardrobe', icon: Briefcase },
  { id: 'discover'as const, label: 'Discover', icon: Search },
  { id: 'profile' as const, label: 'DNA',      icon: User },
];

function MuseApp() {
  const token     = useStore((s) => s.token);
  const user      = useStore((s) => s.user);
  const activeTab = useStore((s) => s.activeTab);
  const setTab    = useStore((s) => s.setActiveTab);
  const logout    = useStore((s) => s.logout);

  // Theme toggle: persist to localStorage
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('muse_theme') === 'dark'
      || (!localStorage.getItem('muse_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('muse_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('muse_theme', 'light');
    }
  }, [isDark]);

  if (!token) return <AuthScreen />;

  return (
    <div className="film-grain relative min-h-dvh">
      <LivingBackground isDark={isDark} />

      <div id="app-shell" className="relative z-10 flex flex-col min-h-dvh">
        {/* ── TOP NAV BAR ── */}
        <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-borderHairline bg-paper/60 backdrop-blur-sm sticky top-0 z-50">
          {/* Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white font-serif font-bold text-xs leading-none">M</span>
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight text-ink-primary">MUSE</span>
          </div>

          {/* Desktop Tab Nav */}
          <nav className="hidden sm:flex items-center gap-1 bg-cardSurface border border-borderHairline rounded-full px-1.5 py-1.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  activeTab === id
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-paper'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[10px] text-ink-tertiary font-medium">{user?.email?.split('@')[0]}</span>
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-borderHairline bg-cardSurface hover:bg-paper transition-colors text-ink-secondary hover:text-ink-primary"
              title={isDark ? 'Switch to Light' : 'Switch to Dark'}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={logout}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-borderHairline bg-cardSurface hover:bg-paper transition-colors text-ink-secondary hover:text-ink-primary"
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 px-6 sm:px-10 py-10 max-w-6xl mx-auto w-full">
          {activeTab === 'today'    && <DailyCapsule />}
          {activeTab === 'closet'   && <ClosetGrid />}
          {activeTab === 'discover' && <DiscoverInsights />}
          {activeTab === 'profile'  && <ProfileDNA />}
        </main>

        {/* ── BOTTOM NAV (Mobile) ── */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-cardSurface/90 backdrop-blur-md border-t border-borderHairline">
          <div className="flex items-stretch">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3.5 text-[10px] font-semibold transition-all ${
                  activeTab === id ? 'text-accent' : 'text-ink-tertiary hover:text-ink-secondary'
                }`}
              >
                <Icon size={17} strokeWidth={activeTab === id ? 2.5 : 1.8} />
                {label}
              </button>
            ))}
          </div>
          {/* Active indicator dot */}
          <div className="absolute top-0 left-0 right-0 flex">
            {NAV_ITEMS.map(({ id }) => (
              <div key={id} className="flex-1 flex justify-center">
                <div className={`h-0.5 w-8 rounded-full transition-all duration-300 ${activeTab === id ? 'bg-accent' : 'bg-transparent'}`} />
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom nav spacer on mobile */}
        <div className="sm:hidden h-20" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MuseApp />
    </QueryClientProvider>
  );
}
