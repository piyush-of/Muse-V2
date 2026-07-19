export interface User {
  id: string;
  email: string;
  name?: string | null;
  timezone: string;
}

export interface ClosetItem {
  id: string;
  userId: string;
  photoUrl: string;
  thumbnailUrl: string;
  category: string;
  color: string;
  season: string;
  formality: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface WearEvent {
  id: string;
  closetItemId: string;
  userId: string;
  wornAt: string | Date;
  outfitId?: string | null;
}

export interface Outfit {
  id: string;
  userId: string;
  date: string;
  itemIds: string[];
  reasoning: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string | null;
  createdAt: string | Date;
  garments?: ClosetItem[];
}

export interface StyleProfile {
  id: string;
  userId: string;
  traits: {
    'relaxed-structured': number;
    'neutral-bold': number;
    'minimal-maximal': number;
    'heritage-modern': number;
    [key: string]: number;
  };
  topColors: string[];
  lastComputedAt: string | Date;
}

export interface DashboardMetrics {
  acceptanceRate: number;
  totalDecisions: number;
  closetCount: number;
  wearEventsCount: number;
}
