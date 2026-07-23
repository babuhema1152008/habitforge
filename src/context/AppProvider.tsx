import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type {
  AppState,
  Challenge,
  ChallengeTemplateId,
  Habit,
  HabitCategory,
  HabitLog,
  DayOfWeek,
  Settings,
  SyncTask,
  UserProfile,
} from '@/types';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/id';
import { todayISO } from '@/lib/date';
import {
  ACHIEVEMENT_BONUS_XP,
  ACHIEVEMENT_DEFS,
  PERFECT_DAY_BONUS_XP,
  computeHabitStreak,
  computeOverallStreak,
  findNewlyUnlockedAchievements,
  isPerfectDay,
  levelFromXp,
  logKey,
  xpForCompletion,
} from '@/lib/gamification';
import { computeChallengeProgress } from '@/lib/challenges';
import { createSampleState } from '@/lib/sampleData';
import { CHALLENGE_TEMPLATES } from '@/lib/challengeTemplates';
import { generateCoachMessages } from '@/lib/coach';
import type { CoachMessage } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { DEMO_EMAIL } from '@/lib/demoAccount';
import {
  achievementToRow,
  challengeToRow,
  habitLogToRow,
  habitToRow,
  profileToRow,
} from '@/lib/sync/mappers';
import { createTask, flush, isOnline, onConnectivityChange, pullAll, reseedRemote, type PulledData } from '@/lib/sync/syncEngine';
import { mergeEntities, mergeKeyed } from '@/lib/sync/merge';
import { useToast } from '@/context/ToastProvider';

const STATE_KEY = 'state_v1';
const SYNC_INTERVAL_MS = 30_000;

function freshUser(id: string, name: string, email: string): UserProfile {
  const emojis = ['🦊', '🐼', '🦉', '🐨', '🐯', '🦁', '🐸', '🐢'];
  const colors = ['#4f46e5', '#14b8a6', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9'];
  return {
    id,
    name,
    email,
    avatarColor: colors[Math.floor(Math.random() * colors.length)],
    avatarEmoji: emojis[Math.floor(Math.random() * emojis.length)],
    createdAt: todayISO(),
    xp: 0,
    level: 1,
    bestOverallStreak: 0,
  };
}

function emptyState(): AppState {
  return {
    isAuthenticated: false,
    user: freshUser('', '', ''),
    habits: [],
    logs: {},
    challenges: [],
    achievements: [],
    settings: { theme: 'light', weekStartsOn: 0, reminderNotesEnabled: true },
    lastCelebratedPerfectDay: null,
    coachState: { celebratedMilestones: {} },
    syncQueue: [],
  };
}

function withAchievementDefs(id: string, unlockedAt: string | null) {
  const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
  return { id, title: def?.title ?? id, description: def?.description ?? '', emoji: def?.emoji ?? '🏅', unlockedAt };
}

type Action =
  | { type: 'AUTH_HYDRATE'; state: AppState }
  | { type: 'AUTH_RESET' }
  | { type: 'ADD_HABIT'; habit: Habit }
  | { type: 'UPDATE_HABIT'; habit: Habit }
  | { type: 'DELETE_HABIT'; habitId: string }
  | { type: 'ARCHIVE_HABIT'; habitId: string; archived: boolean }
  | { type: 'TOGGLE_LOG'; log: HabitLog; xpDelta: number }
  | { type: 'SET_NOTE'; log: HabitLog }
  | { type: 'JOIN_TEMPLATE_CHALLENGE'; challenge: Challenge }
  | { type: 'CREATE_CUSTOM_CHALLENGE'; challenge: Challenge }
  | { type: 'LEAVE_CHALLENGE'; challengeId: string }
  | { type: 'UPDATE_PROFILE'; profile: Partial<UserProfile> }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'UNLOCK_ACHIEVEMENTS'; ids: string[]; defs: { id: string; title: string; description: string; emoji: string }[]; unlockedAt: string }
  | { type: 'COMPLETE_CHALLENGES'; ids: string[]; completedAt: string }
  | { type: 'AWARD_XP'; amount: number }
  | { type: 'ACK_PERFECT_DAY'; date: string }
  | { type: 'COACH_CELEBRATE_MILESTONE'; habitId: string; streak: number }
  | { type: 'ENQUEUE_SYNC_TASKS'; tasks: SyncTask[] }
  | { type: 'DEQUEUE_SYNC_TASKS'; ids: string[] }
  | { type: 'MERGE_REMOTE'; data: PulledData };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'AUTH_HYDRATE':
      return action.state;

    case 'AUTH_RESET':
      return emptyState();

    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.habit] };

    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.habit.id ? action.habit : h)),
      };

    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.habitId),
      };

    case 'ARCHIVE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.habitId ? { ...h, archived: action.archived, updatedAt: new Date().toISOString() } : h
        ),
      };

    case 'TOGGLE_LOG': {
      const key = logKey(action.log.habitId, action.log.date);
      const nextLogs = { ...state.logs, [key]: action.log };
      const newXp = Math.max(0, state.user.xp + action.xpDelta);
      const newLevel = levelFromXp(newXp).level;
      const overallStreak = computeOverallStreak(state.habits, nextLogs, todayISO());
      return {
        ...state,
        logs: nextLogs,
        user: {
          ...state.user,
          xp: newXp,
          level: newLevel,
          bestOverallStreak: Math.max(state.user.bestOverallStreak, overallStreak),
        },
      };
    }

    case 'SET_NOTE': {
      const key = logKey(action.log.habitId, action.log.date);
      return { ...state, logs: { ...state.logs, [key]: action.log } };
    }

    case 'JOIN_TEMPLATE_CHALLENGE':
    case 'CREATE_CUSTOM_CHALLENGE':
      return { ...state, challenges: [...state.challenges, action.challenge] };

    case 'LEAVE_CHALLENGE':
      return { ...state, challenges: state.challenges.filter((c) => c.id !== action.challengeId) };

    case 'UPDATE_PROFILE':
      return { ...state, user: { ...state.user, ...action.profile } };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'UNLOCK_ACHIEVEMENTS': {
      const existingIds = new Set(state.achievements.map((a) => a.id));
      const newAchievements = action.defs
        .filter((d) => !existingIds.has(d.id))
        .map((d) => ({ id: d.id, title: d.title, description: d.description, emoji: d.emoji, unlockedAt: action.unlockedAt }));
      const bonus = ACHIEVEMENT_BONUS_XP * newAchievements.length;
      const newXp = state.user.xp + bonus;
      return {
        ...state,
        achievements: [...state.achievements, ...newAchievements],
        user: { ...state.user, xp: newXp, level: levelFromXp(newXp).level },
      };
    }

    case 'COMPLETE_CHALLENGES': {
      let bonus = 0;
      const challenges = state.challenges.map((c) => {
        if (action.ids.includes(c.id) && !c.completedAt) {
          bonus += c.xpReward;
          return { ...c, completedAt: action.completedAt, updatedAt: action.completedAt };
        }
        return c;
      });
      const newXp = state.user.xp + bonus;
      return { ...state, challenges, user: { ...state.user, xp: newXp, level: levelFromXp(newXp).level } };
    }

    case 'AWARD_XP': {
      const newXp = Math.max(0, state.user.xp + action.amount);
      return { ...state, user: { ...state.user, xp: newXp, level: levelFromXp(newXp).level } };
    }

    case 'ACK_PERFECT_DAY':
      return { ...state, lastCelebratedPerfectDay: action.date };

    case 'COACH_CELEBRATE_MILESTONE': {
      const existing = state.coachState.celebratedMilestones[action.habitId] ?? [];
      if (existing.includes(action.streak)) return state;
      return {
        ...state,
        coachState: {
          ...state.coachState,
          celebratedMilestones: { ...state.coachState.celebratedMilestones, [action.habitId]: [...existing, action.streak] },
        },
      };
    }

    case 'ENQUEUE_SYNC_TASKS': {
      const taskKey = (t: SyncTask) => `${t.table}:${(t.payload.id as string) ?? `${t.payload.habit_id}_${t.payload.date}`}`;
      const incomingKeys = new Set(action.tasks.map(taskKey));
      const remaining = state.syncQueue.filter((t) => !incomingKeys.has(taskKey(t)));
      return { ...state, syncQueue: [...remaining, ...action.tasks] };
    }

    case 'DEQUEUE_SYNC_TASKS': {
      const ids = new Set(action.ids);
      return { ...state, syncQueue: state.syncQueue.filter((t) => !ids.has(t.id)) };
    }

    case 'MERGE_REMOTE': {
      const pendingHabitIds = new Set(state.syncQueue.filter((t) => t.table === 'habits').map((t) => t.payload.id as string));
      const pendingChallengeIds = new Set(state.syncQueue.filter((t) => t.table === 'challenges').map((t) => t.payload.id as string));
      const pendingLogKeys = new Set(
        state.syncQueue.filter((t) => t.table === 'habit_logs').map((t) => `${t.payload.habit_id}_${t.payload.date}`)
      );
      const pendingProfile = state.syncQueue.some((t) => t.table === 'profiles');

      const habits = mergeEntities(state.habits, action.data.habits, pendingHabitIds);
      const challenges = mergeEntities(
        state.challenges.map((c) => ({ ...c })),
        action.data.challenges,
        pendingChallengeIds
      );

      const remoteLogsRecord: Record<string, HabitLog> = {};
      for (const l of action.data.logs) remoteLogsRecord[logKey(l.habitId, l.date)] = l;
      const logs = mergeKeyed(state.logs, remoteLogsRecord, pendingLogKeys);

      const localAchievementIds = new Set(state.achievements.map((a) => a.id));
      const mergedAchievements = [...state.achievements];
      for (const ra of action.data.achievements) {
        if (!localAchievementIds.has(ra.id)) mergedAchievements.push(withAchievementDefs(ra.id, ra.unlockedAt));
      }

      let user = state.user;
      let settings = state.settings;
      let coachState = state.coachState;
      let lastCelebratedPerfectDay = state.lastCelebratedPerfectDay;
      if (!pendingProfile && action.data.profile) {
        user = { ...state.user, ...action.data.profile.user };
        settings = action.data.profile.settings;
        coachState = action.data.profile.coachState;
        lastCelebratedPerfectDay = action.data.profile.lastCelebratedPerfectDay;
      }

      return { ...state, habits, challenges, logs, achievements: mergedAchievements, user, settings, coachState, lastCelebratedPerfectDay };
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  authReady: boolean;
  syncStatus: 'idle' | 'syncing' | 'offline' | 'error';
  todayStats: { total: number; completed: number; percent: number };
  levelProgress: ReturnType<typeof levelFromXp>;
  overallStreak: number;
  signOut: () => void;
  resetDemo: () => Promise<void>;
  addHabit: (input: {
    name: string;
    emoji: string;
    category: HabitCategory;
    color: string;
    targetDays: DayOfWeek[];
    reminderTime?: string;
    notes?: string;
  }) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => void;
  archiveHabit: (habitId: string, archived: boolean) => void;
  toggleLog: (habitId: string, date: string) => void;
  setLogNote: (habitId: string, date: string, note: string) => void;
  joinTemplateChallenge: (templateId: ChallengeTemplateId, habitIds: string[]) => void;
  createCustomChallenge: (input: {
    title: string;
    description: string;
    emoji: string;
    durationDays: number;
    habitIds: string[];
  }) => void;
  leaveChallenge: (challengeId: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  ackPerfectDayCelebration: (date: string) => void;
  coachMessages: CoachMessage[];
  celebrateMilestone: (habitId: string, streak: number) => void;
  acceptIronWillChallenge: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function migrateState(raw: AppState): AppState {
  // Defensively backfill fields added after a user's state was already persisted,
  // so older localStorage snapshots don't crash on load.
  return {
    ...raw,
    coachState: raw.coachState ?? { celebratedMilestones: {} },
    syncQueue: raw.syncQueue ?? [],
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => migrateState(storage.get<AppState>(STATE_KEY, emptyState())));
  const toast = useToast();
  const prevAchievementCount = useRef(state.achievements.length);
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'offline' | 'error'>('idle');
  const skipNextProfileSyncRef = useRef(true);

  useEffect(() => {
    storage.set(STATE_KEY, state);
  }, [state]);

  // --- Auth bootstrap: restore/react to the Supabase session -------------
  const hydrateFromSession = useCallback(async (authUser: SupabaseUser) => {
    const email = authUser.email ?? '';
    let pulled: PulledData;
    try {
      pulled = await pullAll(authUser.id, email);
    } catch {
      // Offline on first load with no cached session state — fall back to a
      // fresh empty shell; local mutations will queue and sync once online.
      skipNextProfileSyncRef.current = true;
      dispatch({
        type: 'AUTH_HYDRATE',
        state: { ...emptyState(), isAuthenticated: true, user: freshUser(authUser.id, (authUser.user_metadata?.name as string) ?? '', email) },
      });
      setAuthReady(true);
      return;
    }

    const base = pulled.profile
      ? {
          ...emptyState(),
          user: { ...freshUser(authUser.id, pulled.profile.user.name ?? '', email), ...pulled.profile.user },
          settings: pulled.profile.settings,
          coachState: pulled.profile.coachState,
          lastCelebratedPerfectDay: pulled.profile.lastCelebratedPerfectDay,
        }
      : { ...emptyState(), user: freshUser(authUser.id, (authUser.user_metadata?.name as string) ?? '', email) };

    const logsRecord: Record<string, HabitLog> = {};
    for (const l of pulled.logs) logsRecord[logKey(l.habitId, l.date)] = l;
    const achievements = pulled.achievements.map((a) => withAchievementDefs(a.id, a.unlockedAt));

    const isBrandNew = pulled.habits.length === 0 && pulled.challenges.length === 0 && pulled.logs.length === 0;

    skipNextProfileSyncRef.current = true;
    dispatch({
      type: 'AUTH_HYDRATE',
      state: { ...base, isAuthenticated: true, habits: pulled.habits, logs: logsRecord, challenges: pulled.challenges, achievements, syncQueue: [] },
    });
    setAuthReady(true);

    // Auto-seed the shared demo account the first time anyone lands on it fresh.
    if (isBrandNew && email === DEMO_EMAIL) {
      const sample = createSampleState();
      const seededUser = { ...sample.user, id: authUser.id, email };
      try {
        await reseedRemote(authUser.id, { habits: sample.habits, logs: Object.values(sample.logs), challenges: sample.challenges });
        await supabase.from('profiles').upsert(
          profileToRow({ user: seededUser, settings: sample.settings, coachState: sample.coachState, lastCelebratedPerfectDay: null, isDemo: true })
        );
        skipNextProfileSyncRef.current = true;
        dispatch({ type: 'AUTH_HYDRATE', state: { ...sample, isAuthenticated: true, user: seededUser, syncQueue: [] } });
      } catch {
        // Seeding failed (e.g. offline) — the demo account just starts empty; a
        // later "Reset to Demo Data" click will retry.
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) void hydrateFromSession(session.user);
      else setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        void hydrateFromSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'AUTH_RESET' });
        setAuthReady(true);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrateFromSession]);

  // --- Sync engine: push queued mutations, pull on reconnect -------------
  const queueRef = useRef(state.syncQueue);
  useEffect(() => {
    queueRef.current = state.syncQueue;
  }, [state.syncQueue]);
  const flushingRef = useRef(false);

  const runFlush = useCallback(async () => {
    if (flushingRef.current) return;
    if (!isOnline()) {
      setSyncStatus('offline');
      return;
    }
    const queue = queueRef.current;
    if (queue.length === 0) {
      setSyncStatus('idle');
      return;
    }
    flushingRef.current = true;
    setSyncStatus('syncing');
    const { succeededIds, failed } = await flush(queue);
    if (succeededIds.length > 0) dispatch({ type: 'DEQUEUE_SYNC_TASKS', ids: succeededIds });
    setSyncStatus(failed ? 'error' : 'idle');
    flushingRef.current = false;
  }, []);

  const pullAndMerge = useCallback(async () => {
    if (!state.isAuthenticated || !state.user.id) return;
    try {
      const data = await pullAll(state.user.id, state.user.email);
      dispatch({ type: 'MERGE_REMOTE', data });
    } catch {
      // Offline or transient error — the periodic/online-triggered retry will catch up.
    }
  }, [state.isAuthenticated, state.user.id, state.user.email]);

  useEffect(() => {
    void runFlush();
  }, [state.syncQueue, runFlush]);

  useEffect(
    () =>
      onConnectivityChange(
        () => {
          void runFlush();
          void pullAndMerge();
        },
        () => setSyncStatus('offline')
      ),
    [runFlush, pullAndMerge]
  );

  useEffect(() => {
    const id = window.setInterval(() => void runFlush(), SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [runFlush]);

  // Any change to profile-shaped fields (xp/level/settings/coach state/etc.)
  // gets coalesced into a single queued profile upsert, instead of every
  // action-creator having to remember to enqueue one.
  useEffect(() => {
    if (!state.isAuthenticated) return;
    if (skipNextProfileSyncRef.current) {
      skipNextProfileSyncRef.current = false;
      return;
    }
    const task = createTask(
      'profiles',
      'upsert',
      profileToRow({ user: state.user, settings: state.settings, coachState: state.coachState, lastCelebratedPerfectDay: state.lastCelebratedPerfectDay })
    );
    dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [task] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.isAuthenticated,
    state.user.xp,
    state.user.level,
    state.user.name,
    state.user.avatarEmoji,
    state.user.avatarColor,
    state.user.bestOverallStreak,
    state.settings,
    state.coachState,
    state.lastCelebratedPerfectDay,
  ]);

  // Game-engine effect: after any state change, check for newly unlocked
  // achievements and newly completed challenges, then react with toasts + sync.
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const newlyUnlocked = findNewlyUnlockedAchievements(state);
    if (newlyUnlocked.length > 0) {
      const unlockedAt = new Date().toISOString();
      dispatch({ type: 'UNLOCK_ACHIEVEMENTS', ids: newlyUnlocked.map((a) => a.id), defs: newlyUnlocked, unlockedAt });
      dispatch({
        type: 'ENQUEUE_SYNC_TASKS',
        tasks: newlyUnlocked.map((a) =>
          createTask('achievements', 'upsert', achievementToRow({ id: a.id, title: a.title, description: a.description, emoji: a.emoji, unlockedAt }, state.user.id))
        ),
      });
    }

    const newlyCompleted = state.challenges.filter((c) => {
      if (c.completedAt) return false;
      const progress = computeChallengeProgress(c, state.habits, state.logs);
      return progress.isSuccessful;
    });
    if (newlyCompleted.length > 0) {
      const completedAt = new Date().toISOString();
      dispatch({ type: 'COMPLETE_CHALLENGES', ids: newlyCompleted.map((c) => c.id), completedAt });
      dispatch({
        type: 'ENQUEUE_SYNC_TASKS',
        tasks: newlyCompleted.map((c) => createTask('challenges', 'upsert', challengeToRow({ ...c, completedAt, updatedAt: completedAt }, state.user.id))),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.logs, state.challenges, state.isAuthenticated]);

  // Toast side-effects for newly unlocked achievements (separate pass so we
  // toast exactly once per unlock, driven by array-length delta).
  useEffect(() => {
    if (state.achievements.length > prevAchievementCount.current) {
      const newest = state.achievements.slice(prevAchievementCount.current);
      for (const a of newest) {
        toast.push({ type: 'xp', title: `Achievement unlocked: ${a.title}`, description: `${a.emoji} +${ACHIEVEMENT_BONUS_XP} XP` });
      }
    }
    prevAchievementCount.current = state.achievements.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.achievements]);

  const today = todayISO();
  const todayStats = useMemo(() => {
    const applicable = state.habits.filter((h) => !h.archived && h.targetDays.includes(new Date(`${today}T00:00:00`).getDay() as DayOfWeek) && h.createdAt <= today);
    const completed = applicable.filter((h) => state.logs[logKey(h.id, today)]?.completed).length;
    return {
      total: applicable.length,
      completed,
      percent: applicable.length > 0 ? Math.round((completed / applicable.length) * 100) : 0,
    };
  }, [state.habits, state.logs, today]);

  const levelProgress = useMemo(() => levelFromXp(state.user.xp), [state.user.xp]);
  const overallStreak = useMemo(() => computeOverallStreak(state.habits, state.logs, today), [state.habits, state.logs, today]);

  const signOut = useCallback(() => {
    void supabase.auth.signOut();
  }, []);

  const resetDemo = useCallback(async () => {
    const sample = createSampleState();
    const userId = state.user.id;
    const email = state.user.email;
    const seededUser = { ...sample.user, id: userId, email };
    await reseedRemote(userId, { habits: sample.habits, logs: Object.values(sample.logs), challenges: sample.challenges });
    await supabase
      .from('profiles')
      .upsert(profileToRow({ user: seededUser, settings: state.settings, coachState: { celebratedMilestones: {} }, lastCelebratedPerfectDay: null }));
    skipNextProfileSyncRef.current = true;
    dispatch({
      type: 'AUTH_HYDRATE',
      state: {
        ...sample,
        isAuthenticated: true,
        user: seededUser,
        settings: state.settings,
        coachState: { celebratedMilestones: {} },
        lastCelebratedPerfectDay: null,
        syncQueue: [],
      },
    });
  }, [state.user.id, state.user.email, state.settings]);

  const addHabit: AppContextValue['addHabit'] = useCallback(
    (input) => {
      const nowIso = new Date().toISOString();
      const habit: Habit = { id: generateId(), archived: false, createdAt: todayISO(), updatedAt: nowIso, deletedAt: null, ...input };
      dispatch({ type: 'ADD_HABIT', habit });
      dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('habits', 'upsert', habitToRow(habit, state.user.id))] });
    },
    [state.user.id]
  );

  const updateHabit = useCallback(
    (habit: Habit) => {
      const updated = { ...habit, updatedAt: new Date().toISOString() };
      dispatch({ type: 'UPDATE_HABIT', habit: updated });
      dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('habits', 'upsert', habitToRow(updated, state.user.id))] });
    },
    [state.user.id]
  );

  const deleteHabit = useCallback(
    (habitId: string) => {
      const habit = state.habits.find((h) => h.id === habitId);
      dispatch({ type: 'DELETE_HABIT', habitId });
      if (habit) {
        const tombstoned = { ...habit, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('habits', 'upsert', habitToRow(tombstoned, state.user.id))] });
      }
    },
    [state.habits, state.user.id]
  );

  const archiveHabit = useCallback(
    (habitId: string, archived: boolean) => {
      dispatch({ type: 'ARCHIVE_HABIT', habitId, archived });
      const habit = state.habits.find((h) => h.id === habitId);
      if (habit) {
        const updated = { ...habit, archived, updatedAt: new Date().toISOString() };
        dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('habits', 'upsert', habitToRow(updated, state.user.id))] });
      }
    },
    [state.habits, state.user.id]
  );

  const toggleLog = useCallback(
    (habitId: string, date: string) => {
      const habit = state.habits.find((h) => h.id === habitId);
      if (!habit) return;
      const key = logKey(habitId, date);
      const existing = state.logs[key];
      const nowCompleted = !existing?.completed;
      const nowIso = new Date().toISOString();
      let xpDelta = 0;
      let newLog: HabitLog;

      if (nowCompleted) {
        const priorStreak = computeHabitStreak(habit, state.logs, date);
        const newStreak = priorStreak + 1;
        const gained = xpForCompletion(newStreak);
        xpDelta += gained;
        newLog = { habitId, date, completed: true, note: existing?.note, xpAwarded: gained, completedAt: nowIso, updatedAt: nowIso };
      } else {
        xpDelta -= existing?.xpAwarded ?? 0;
        newLog = { habitId, date, completed: false, note: existing?.note, xpAwarded: 0, completedAt: existing?.completedAt ?? nowIso, updatedAt: nowIso };
      }

      const nextLogsPreview = { ...state.logs, [key]: newLog };
      const wasPerfect = isPerfectDay(state.habits, state.logs, date);
      const nowPerfect = isPerfectDay(state.habits, nextLogsPreview, date);
      if (!wasPerfect && nowPerfect) xpDelta += PERFECT_DAY_BONUS_XP;
      if (wasPerfect && !nowPerfect) xpDelta -= PERFECT_DAY_BONUS_XP;

      dispatch({ type: 'TOGGLE_LOG', log: newLog, xpDelta });
      dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('habit_logs', 'upsert', habitLogToRow(newLog, state.user.id))] });

      if (nowCompleted) {
        const streak = computeHabitStreak(habit, state.logs, date) + 1;
        toast.push({
          type: 'xp',
          title: `${habit.emoji} ${habit.name} complete!`,
          description: streak > 1 ? `${streak}-day streak · +${xpForCompletion(streak)} XP` : `+${xpForCompletion(streak)} XP`,
        });
      }
    },
    [state.logs, state.habits, state.user.id, toast]
  );

  const setLogNote = useCallback(
    (habitId: string, date: string, note: string) => {
      const key = logKey(habitId, date);
      const existing = state.logs[key];
      const nowIso = new Date().toISOString();
      const newLog: HabitLog = existing
        ? { ...existing, note, updatedAt: nowIso }
        : { habitId, date, completed: false, note, xpAwarded: 0, completedAt: nowIso, updatedAt: nowIso };
      dispatch({ type: 'SET_NOTE', log: newLog });
      dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('habit_logs', 'upsert', habitLogToRow(newLog, state.user.id))] });
    },
    [state.logs, state.user.id]
  );

  const joinTemplateChallenge = useCallback(
    (templateId: ChallengeTemplateId, habitIds: string[]) => {
      const tpl = CHALLENGE_TEMPLATES.find((t) => t.templateId === templateId);
      if (!tpl) return;
      const nowIso = new Date().toISOString();
      const challenge: Challenge = {
        id: generateId(),
        title: tpl.title,
        description: tpl.description,
        emoji: tpl.emoji,
        durationDays: tpl.durationDays,
        startDate: todayISO(),
        habitIds,
        templateId: tpl.templateId,
        xpReward: tpl.xpReward,
        badgeEmoji: tpl.badgeEmoji,
        completedAt: null,
        joined: true,
        updatedAt: nowIso,
        deletedAt: null,
      };
      dispatch({ type: 'JOIN_TEMPLATE_CHALLENGE', challenge });
      dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('challenges', 'upsert', challengeToRow(challenge, state.user.id))] });
      toast.push({ type: 'success', title: `Joined: ${tpl.title}`, description: 'Good luck — consistency is the whole game.' });
    },
    [state.user.id, toast]
  );

  const createCustomChallenge: AppContextValue['createCustomChallenge'] = useCallback(
    (input) => {
      const nowIso = new Date().toISOString();
      const challenge: Challenge = {
        id: generateId(),
        title: input.title,
        description: input.description,
        emoji: input.emoji || '🎯',
        durationDays: input.durationDays,
        startDate: todayISO(),
        habitIds: input.habitIds,
        templateId: 'custom',
        xpReward: Math.max(50, input.durationDays * 10),
        badgeEmoji: '🎯',
        completedAt: null,
        joined: true,
        updatedAt: nowIso,
        deletedAt: null,
      };
      dispatch({ type: 'CREATE_CUSTOM_CHALLENGE', challenge });
      dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('challenges', 'upsert', challengeToRow(challenge, state.user.id))] });
      toast.push({ type: 'success', title: `Custom challenge created: ${input.title}` });
    },
    [state.user.id, toast]
  );

  const leaveChallenge = useCallback(
    (challengeId: string) => {
      const challenge = state.challenges.find((c) => c.id === challengeId);
      dispatch({ type: 'LEAVE_CHALLENGE', challengeId });
      if (challenge) {
        const nowIso = new Date().toISOString();
        const tombstoned = { ...challenge, deletedAt: nowIso, updatedAt: nowIso };
        dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('challenges', 'upsert', challengeToRow(tombstoned, state.user.id))] });
      }
    },
    [state.challenges, state.user.id]
  );

  const updateProfile = useCallback((profile: Partial<UserProfile>) => dispatch({ type: 'UPDATE_PROFILE', profile }), []);
  const updateSettings = useCallback((settings: Partial<Settings>) => dispatch({ type: 'UPDATE_SETTINGS', settings }), []);
  const ackPerfectDayCelebration = useCallback((date: string) => dispatch({ type: 'ACK_PERFECT_DAY', date }), []);

  // Coach messages are time-sensitive (e.g. evening streak alerts), so tick every
  // minute to keep them fresh without requiring a user action.
  const [coachNow, setCoachNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setCoachNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const coachMessages = useMemo(() => (state.isAuthenticated ? generateCoachMessages(state, coachNow) : []), [state, coachNow]);

  const celebrateMilestone = useCallback(
    (habitId: string, streak: number) => dispatch({ type: 'COACH_CELEBRATE_MILESTONE', habitId, streak }),
    []
  );

  const acceptIronWillChallenge = useCallback(() => {
    const activeHabits = state.habits.filter((h) => !h.archived);
    if (activeHabits.length === 0) return;
    const nowIso = new Date().toISOString();
    const challenge: Challenge = {
      id: generateId(),
      title: 'Iron Will Challenge',
      description: "Complete every habit, every day, for a full week. Coach Nova's toughest challenge.",
      emoji: '🛡️',
      durationDays: 7,
      startDate: todayISO(),
      habitIds: activeHabits.map((h) => h.id),
      templateId: 'custom',
      xpReward: 150,
      badgeEmoji: '🛡️',
      completedAt: null,
      joined: true,
      updatedAt: nowIso,
      deletedAt: null,
    };
    dispatch({ type: 'CREATE_CUSTOM_CHALLENGE', challenge });
    dispatch({ type: 'ENQUEUE_SYNC_TASKS', tasks: [createTask('challenges', 'upsert', challengeToRow(challenge, state.user.id))] });
    toast.push({ type: 'success', title: 'Iron Will Challenge accepted!', description: '🛡️ Complete every habit for 7 days straight.' });
  }, [state.habits, state.user.id, toast]);

  const value: AppContextValue = {
    state,
    authReady,
    syncStatus,
    todayStats,
    levelProgress,
    overallStreak,
    signOut,
    resetDemo,
    addHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    toggleLog,
    setLogNote,
    joinTemplateChallenge,
    createCustomChallenge,
    leaveChallenge,
    updateProfile,
    updateSettings,
    ackPerfectDayCelebration,
    coachMessages,
    celebrateMilestone,
    acceptIronWillChallenge,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
