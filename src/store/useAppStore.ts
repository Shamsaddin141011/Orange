import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MatchResult, ShortlistTag, StudentProfile, TrackerItemState } from '../types';

interface AppState {
  profile: StudentProfile;
  shortlist: Record<string, { tag: ShortlistTag; note: string }>;
  compareIds: string[];
  tracker: Record<string, TrackerItemState>;
  matches: MatchResult[];
  setProfile: (profile: StudentProfile) => void;
  setMatches: (matches: MatchResult[]) => void;
  toggleShortlist: (id: string) => void;
  setShortlistMeta: (id: string, tag: ShortlistTag, note: string) => void;
  toggleCompare: (id: string) => void;
  setTracker: (id: string, tracker: TrackerItemState) => void;
}

const defaultProfile: StudentProfile = { country: 'USA', interests: [] };

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      shortlist: {},
      compareIds: [],
      tracker: {},
      matches: [],
      setProfile: (profile) => set({ profile }),
      setMatches: (matches) => set({ matches }),
      toggleShortlist: (id) =>
        set((state) => {
          const shortlist = { ...state.shortlist };
          if (shortlist[id]) delete shortlist[id];
          else shortlist[id] = { tag: 'match', note: '' };
          return { shortlist };
        }),
      setShortlistMeta: (id, tag, note) => set((state) => ({ shortlist: { ...state.shortlist, [id]: { tag, note } } })),
      toggleCompare: (id) =>
        set((state) => {
          const exists = state.compareIds.includes(id);
          if (exists) return { compareIds: state.compareIds.filter((v) => v !== id) };
          if (state.compareIds.length >= 3) return state;
          return { compareIds: [...state.compareIds, id] };
        }),
      setTracker: (id, tracker) => set((state) => ({ tracker: { ...state.tracker, [id]: tracker } }))
    }),
    {
      name: 'orangeuni-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ profile: s.profile, shortlist: s.shortlist, compareIds: s.compareIds, tracker: s.tracker })
    }
  )
);
