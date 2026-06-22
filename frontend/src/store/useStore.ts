import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  timezone: string;
}

interface AppState {
  // Authentication State
  token: string | null;
  user: User | null;
  setAuth: (token: string | null, user: User | null) => void;
  logout: () => void;

  // View Navigation State
  activeTab: 'today' | 'closet' | 'discover' | 'profile';
  setActiveTab: (tab: 'today' | 'closet' | 'discover' | 'profile') => void;

  // Weather and occasion stubs
  weather: string;
  calendarEvent: string;
}

export const useStore = create<AppState>((set) => ({
  // Read initial auth state from localStorage
  token: localStorage.getItem('muse_jwt_token'),
  user: (() => {
    const saved = localStorage.getItem('muse_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),

  setAuth: (token, user) => {
    if (token && user) {
      localStorage.setItem('muse_jwt_token', token);
      localStorage.setItem('muse_user', JSON.stringify(user));
      set({ token, user });
    } else {
      localStorage.removeItem('muse_jwt_token');
      localStorage.removeItem('muse_user');
      set({ token: null, user: null });
    }
  },

  logout: () => {
    localStorage.removeItem('muse_jwt_token');
    localStorage.removeItem('muse_user');
    set({ token: null, user: null, activeTab: 'today' });
  },

  activeTab: 'today',
  setActiveTab: (activeTab) => set({ activeTab }),

  weather: "Rainy, 18°C",
  calendarEvent: "Client Pitch Meeting"
}));
