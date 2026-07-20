import { create } from 'zustand';

interface CapsuleState {
  currentIndex: number;
  acceptedOutfitId: string | null;
  nextCard: () => void;
  setAcceptedOutfitId: (id: string | null) => void;
  reset: () => void;
}

/**
 * Local, ephemeral swipe-deck UI state — which card is on top and whether one
 * has been accepted. Deliberately kept separate from server data (which lives
 * in React Query) so the swipe interaction never lags waiting on a network
 * round-trip.
 */
export const useCapsuleStore = create<CapsuleState>((set) => ({
  currentIndex: 0,
  acceptedOutfitId: null,
  nextCard: () => set((state) => ({ currentIndex: state.currentIndex + 1 })),
  setAcceptedOutfitId: (id) => set({ acceptedOutfitId: id }),
  reset: () => set({ currentIndex: 0, acceptedOutfitId: null }),
}));
