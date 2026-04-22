import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { fetchUniversities, supabase } from '../lib/supabase';
import { rowToUniversity } from '../lib/transform';
import { scoreUniversity } from '../utils/scoring';
import { ApplicationStatus, MatchResult, ShortlistMeta, ShortlistTag, StudentProfile, TrackerItemState } from '../types';

interface AppState {
  session: Session | null;
  profile: StudentProfile;
  username: string | null;
  userDataLoaded: boolean;
  shortlist: Record<string, ShortlistMeta>;
  compareIds: string[];
  tracker: Record<string, TrackerItemState>;
  matches: MatchResult[];
  loading: boolean;
  error: string | null;

  setSession: (session: Session | null) => void;
  setProfile: (profile: StudentProfile) => void;
  setUsername: (username: string | null) => void;
  setMatches: (matches: MatchResult[]) => void;
  fetchAndScore: (profile: StudentProfile) => Promise<void>;
  loadUserData: () => Promise<void>;
  saveProfile: (profile: StudentProfile) => Promise<void>;
  toggleShortlist: (id: string) => void;
  setShortlistMeta: (id: string, updates: Partial<ShortlistMeta>) => void;
  toggleCompare: (id: string) => void;
  setTracker: (id: string, tracker: TrackerItemState) => void;
  signOut: () => Promise<void>;
}

const defaultProfile: StudentProfile = { country: 'USA', interests: [] };

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      profile: defaultProfile,
      username: null,
      userDataLoaded: false,
      shortlist: {},
      compareIds: [],
      tracker: {},
      matches: [],
      loading: false,
      error: null,

      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setUsername: (username) => set({ username }),
      setMatches: (matches) => set({ matches }),

      fetchAndScore: async (profile) => {
        set({ loading: true, error: null });
        try {
          // Map display label → DB key
          const degreeLevelMap: Record<string, string> = {
            "Bachelor's": 'Bachelor',
            "Master's":   'Master',
            'PhD':        'PhD',
            "Associate's":'Associate',
          };
          const rows = await fetchUniversities({
            country: profile.country,
            satTotal: profile.satTotal,
            budgetMin: profile.budgetMin,
            budgetMax: profile.budgetMax,
            degreeLevel: profile.degreeLevel ? degreeLevelMap[profile.degreeLevel] : undefined,
            limit: 2000,
          });
          const universities = rows.map(rowToUniversity);
          const hasInterests = profile.interests.length > 0;
          const scored = universities
            .map((u) => scoreUniversity(profile, u))
            .filter((r) => !hasInterests || r.breakdown.interest > 0)
            .sort((a, b) => b.score - a.score);
          set({ matches: scored, profile, loading: false });
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'Failed to load universities.' });
        }
      },

      // Load all user data from Supabase after sign-in
      loadUserData: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const uid = session.user.id;

        const [profileRes, shortlistRes, trackerRes, compareRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', uid).single(),
          supabase.from('shortlist').select('*').eq('user_id', uid),
          supabase.from('tracker').select('*').eq('user_id', uid),
          supabase.from('compare_list').select('university_ids').eq('user_id', uid).single(),
        ]);

        if (profileRes.data) {
          const p = profileRes.data;
          set({ username: p.username ?? null });
          set({
            profile: {
              country: p.country ?? 'USA',
              interests: p.interests ?? [],
              degreeLevel: p.degree_level ?? undefined,
              budgetMin: p.budget_min ?? undefined,
              budgetMax: p.budget_max ?? undefined,
              preferredLocation: p.preferred_location ?? undefined,
              satTotal: p.sat_total ?? undefined,
              satMath: p.sat_math ?? undefined,
              satEbrw: p.sat_ebrw ?? undefined,
              ibScore: p.ib_score ?? undefined,
              act: p.act ?? undefined,
              ielts: p.ielts ?? undefined,
              toefl: p.toefl ?? undefined,
              gpa: p.gpa ?? undefined,
              greVerbal: p.gre_verbal ?? undefined,
              greQuant: p.gre_quant ?? undefined,
            },
          });
        }

        if (shortlistRes.data) {
          const shortlist: Record<string, ShortlistMeta> = {};
          for (const row of shortlistRes.data) {
            shortlist[row.university_id] = {
              tag: row.tag,
              note: row.note,
              deadline: row.deadline ?? undefined,
              appStatus: (row.app_status as ApplicationStatus) ?? 'unsent',
            };
          }
          set({ shortlist });
        }

        if (trackerRes.data) {
          const tracker: Record<string, TrackerItemState> = {};
          for (const row of trackerRes.data) {
            tracker[row.university_id] = {
              essays: row.essays,
              recommendations: row.recommendations,
              testScores: row.test_scores,
              feeWaiver: row.fee_waiver,
              visaDocs: row.visa_docs,
              status: row.status,
              reminder: row.reminder,
            };
          }
          set({ tracker });
        }

        if (compareRes.data) {
          set({ compareIds: compareRes.data.university_ids ?? [] });
        }
        set({ userDataLoaded: true });
      },

      // Save profile to Supabase
      saveProfile: async (profile) => {
        set({ profile });
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.from('profiles').upsert({
          id: session.user.id,
          country: profile.country,
          interests: profile.interests,
          degree_level: profile.degreeLevel ?? null,
          budget_min: profile.budgetMin ?? null,
          budget_max: profile.budgetMax ?? null,
          preferred_location: profile.preferredLocation ?? null,
          sat_total: profile.satTotal ?? null,
          sat_math: profile.satMath ?? null,
          sat_ebrw: profile.satEbrw ?? null,
          ib_score: profile.ibScore ?? null,
          act: profile.act ?? null,
          ielts: profile.ielts ?? null,
          toefl: profile.toefl ?? null,
          gpa: profile.gpa ?? null,
          gre_verbal: profile.greVerbal ?? null,
          gre_quant: profile.greQuant ?? null,
          updated_at: new Date().toISOString(),
        });
      },

      toggleShortlist: (id) => {
        set((state) => {
          const shortlist = { ...state.shortlist };
          if (shortlist[id]) delete shortlist[id];
          else shortlist[id] = { tag: 'match', note: '', appStatus: 'unsent' };
          return { shortlist };
        });
        // Sync to Supabase
        (async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { shortlist } = get();
          if (shortlist[id]) {
            const { error } = await supabase.from('shortlist').upsert(
              { user_id: session.user.id, university_id: id, ...shortlist[id] },
              { onConflict: 'user_id,university_id' }
            );
            if (error) console.error('[shortlist upsert]', error.message);
          } else {
            const { error } = await supabase.from('shortlist')
              .delete()
              .eq('user_id', session.user.id)
              .eq('university_id', id);
            if (error) console.error('[shortlist delete]', error.message);
          }
        })();
      },

      setShortlistMeta: (id, updates) => {
        set((state) => ({
          shortlist: { ...state.shortlist, [id]: { ...state.shortlist[id], ...updates } },
        }));
        (async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const meta = get().shortlist[id];
          // Try full upsert including new columns; fall back without them if migration not run yet
          const { error } = await supabase.from('shortlist').upsert(
            {
              user_id: session.user.id,
              university_id: id,
              tag: meta.tag,
              note: meta.note,
              deadline: meta.deadline ?? null,
              app_status: meta.appStatus ?? 'unsent',
            },
            { onConflict: 'user_id,university_id' }
          );
          if (error) {
            if (error.message?.includes('deadline') || error.message?.includes('app_status') || error.message?.includes('column')) {
              await supabase.from('shortlist').upsert(
                { user_id: session.user.id, university_id: id, tag: meta.tag, note: meta.note },
                { onConflict: 'user_id,university_id' }
              );
            } else {
              console.error('[shortlistMeta upsert]', error.message);
            }
          }
        })();
      },

      toggleCompare: (id) => {
        set((state) => {
          const exists = state.compareIds.includes(id);
          if (exists) return { compareIds: state.compareIds.filter((v) => v !== id) };
          if (state.compareIds.length >= 3) return state;
          return { compareIds: [...state.compareIds, id] };
        });
        // Sync to Supabase
        (async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { compareIds } = get();
          const { error } = await supabase.from('compare_list').upsert(
            { user_id: session.user.id, university_ids: compareIds },
            { onConflict: 'user_id' }
          );
          if (error) console.error('[compare_list upsert]', error.message);
        })();
      },

      setTracker: (id, trackerItem) => {
        set((state) => ({ tracker: { ...state.tracker, [id]: trackerItem } }));
        (async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { error } = await supabase.from('tracker').upsert(
            {
              user_id: session.user.id,
              university_id: id,
              essays: trackerItem.essays,
              recommendations: trackerItem.recommendations,
              test_scores: trackerItem.testScores,
              fee_waiver: trackerItem.feeWaiver,
              visa_docs: trackerItem.visaDocs,
              status: trackerItem.status,
              reminder: trackerItem.reminder,
            },
            { onConflict: 'user_id,university_id' }
          );
          if (error) console.error('[tracker upsert]', error.message);
        })();
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({
          session: null,
          profile: defaultProfile,
          username: null,
          userDataLoaded: false,
          shortlist: {},
          compareIds: [],
          tracker: {},
          matches: [],
        });
      },
    }),
    {
      name: 'orangeuni-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist profile locally — shortlist/compare/tracker are loaded
      // fresh from Supabase on sign-in to avoid stale-cache race conditions.
      partialize: (s) => ({ profile: s.profile }),
    }
  )
);
