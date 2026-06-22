import React from 'react';
import { useStore } from '../store/useStore';
import { Layers, FolderClosed, ShoppingBag, User, LogOut, Cloud, Calendar } from 'lucide-react';

export default function TabNavigation() {
  const { activeTab, setActiveTab, weather, calendarEvent, logout } = useStore();

  const tabs = [
    { id: 'today', name: 'Today', icon: Layers },
    { id: 'closet', name: 'Closet', icon: FolderClosed },
    { id: 'discover', name: 'Discover', icon: ShoppingBag },
    { id: 'profile', name: 'Style DNA', icon: User },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur-md border-b border-borderHairline">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <h1 
            onClick={() => setActiveTab('today')}
            className="font-serif text-2xl tracking-widest text-ink-primary cursor-pointer select-none"
          >
            MUSE
          </h1>
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        </div>

        {/* Center Tabs */}
        <nav className="flex gap-1 bg-cardSurface border border-borderHairline rounded-full p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-tight transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-paper/50'
                }`}
              >
                <Icon size={13} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Widgets */}
        <div className="flex items-center gap-4 text-xs text-ink-secondary font-sans">
          <div className="flex items-center gap-1.5">
            <Cloud size={13} className="text-ink-tertiary" />
            <span>{weather}</span>
          </div>
          <div className="w-[1px] h-3 bg-borderHairline" />
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-ink-tertiary" />
            <span>{calendarEvent}</span>
          </div>
          <div className="w-[1px] h-3 bg-borderHairline" />
          <button
            onClick={logout}
            className="flex items-center gap-1 hover:text-accent font-semibold transition-colors"
            title="Log Out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  );
}
