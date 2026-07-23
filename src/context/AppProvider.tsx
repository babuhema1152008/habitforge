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
import type {
  AppState,
  Challenge,
  ChallengeTemplateId,
  Habit,
  HabitCategory,
  DayOfWeek,
  Settings,
  UserProfile,
} from '@/types';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/id';
import { todayISO } from '@/lib/date';
import {
  ACHIEVEMENT_BONUS_XP,
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
import { useToast } from '@/context/ToastProvider';

const STATE_KEY = 'state_v1';

function freshUser(name: string, email: string): UserProfile {
  const emojis = ['🦊', '🐼', '🦉', '🐨', '🐯', '🦁', '🐸', '🐢'];
  const colors = ['#4f46e5', '#14b8a6', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9'];
  return {
    id: generateId('user'),
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
    user: freshUser('', ''),
    habits: [],
    logs: {},
    challenges: [],
    achievements: [],
    settings: { theme: 'light', weekStartsOn: 0, reminderNotesEnabled: true },
    lastCelebratedPerfectDay: null,
    coachState: { celebratedMilestones: {} },
  };
}

type Action =
  | { type: 'SIGN_IN'; name: string; email: string; seedSampleData: boolean }
  | { type: 'SIGN_OUT' }
  | { type: 'ADD_HABIT'; habit: Habit }
  | { type: 'UPDATE_HABIT'; habit: Habit }
  | { type: 'DELETE_HABIT'; habitId: string }
  | { type: 'ARCHIVE_HABIT'; habitId: string; archived: boolean }
  | { type: 'TOGGLE_LOG'; habitId: string; date: string }
  | { type: 'SET_NOTE'; habitId: string; date: string; note: string }
  | { type: 'JOIN_TEMPLATE_CHALLENGE'; challenge: Challenge }
  | { type: 'CREATE_CUSTOM_CHALLENGE'; challenge: Challenge }
  | { type: 'LEAVE_CHALLENGE'; challengeId: string }
  | { type: 'UPDATE_PROFILE'; profile: Partial<UserProfile> }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'UNLOCK_ACHIEVEMENTS'; ids: string[]; defs: { id: string; title: string; description: string; emoji: string }[] }
  | { type: 'COMPLETE_CHALLENGES'; ids: string[] }
  | { type: 'AWARD_XP'; amount: number }
  | { type: 'ACK_PERFECT_DAY'; date: string }
  | { type: 'COACH_CELEBRATE_MILESTONE'; habitId: string; streak: number }
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'RESET_DEMO' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'SIGN_IN': {
      const base = action.seedSampleData ? createSampleState() : emptyState();
      return {
        ...base,
        isAuthenticated: true,
        user: action.seedSampleData
          ? { ...base.user, name: action.name || base.user.name, email: action.email || base.user.email }
          : freshUser(action.name, action.email),
      };
    }

    case 'SIGN_OUT':
      return { ...state, isAuthenticated: false };

    case 'RESET_DEMO':
      return { ...createSampleState(), settings: state.settings };

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
        habits: state.habits.map((h) => (h.id === action.habitId ? { ...h, archived: action.archived } : h)),
      };

    case 'TOGGLE_LOG': {
      const key = logKey(action.habitId, action.date);
      const habit = state.habits.find((h) => h.id === action.habitId);
      if (!habit) return state;
      const existing = state.logs[key];
      const nowCompleted = !existing?.completed;
      const nextLogs = { ...state.logs };
      let xpDelta = 0;

      if (nowCompleted) {
        const priorStreak = computeHabitStreak(habit, state.logs, action.date) ;
        const newStreak = priorStreak + 1;
        const gained = xpForCompletion(newStreak);
        xpDelta += gained;
        nextLogs[key] = {
          habitId: action.habitId,
          date: action.date,
          completed: true,
          note: existing?.note,
          xpAwarded: gained,
          completedAt: new Date().toISOString(),
        };
      } else {
        xpDelta -= existing?.xpAwarded ?? 0;
        nextLogs[key] = {
          habitId: action.habitId,
          date: action.date,
          completed: false,
          note: existing?.note,
          xpAwarded: 0,
          completedAt: existing?.completedAt ?? new Date().toISOString(),
        };
      }

      // Perfect-day bonus (awarded once per date, reversed if broken)
      const wasPerfect = isPerfectDay(state.habits, state.logs, action.date);
      const nowPerfect = isPerfectDay(state.habits, nextLogs, action.date);
      if (!wasPerfect && nowPerfect) xpDelta += PERFECT_DAY_BONUS_XP;
      if (wasPerfect && !nowPerfect) xpDelta -= PERFECT_DAY_BONUS_XP;

      const newXp = Math.max(0, state.user.xp + xpDelta);
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
      const now = new Date().toISOString();
      const existingIds = new Set(state.achievements.map((a) => a.id));
      const newAchievements = action.defs
        .filter((d) => !existingIds.has(d.id))
        .map((d) => ({ id: d.id, title: d.title, description: d.description, emoji: d.emoji, unlockedAt: now }));
      const bonus = ACHIEVEMENT_BONUS_XP * newAchievements.length;
      const newXp = state.user.xp + bonus;
      return {
        ...state,
        achievements: [...state.achievements, ...newAchievements],
        user: { ...state.user, xp: newXp, level: levelFromXp(newXp).level },
      };
    }

    case 'COMPLETE_CHALLENGES': {
      const now = new Date().toISOString();
      let bonus = 0;
      const challenges = state.challenges.map((c) => {
        if (action.ids.includes(c.id) && !c.completedAt) {
          bonus += c.xpReward;
          return { ...c, completedAt: now };
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

    case 'SET_NOTE': {
      const key = logKey(action.habitId, action.date);
      const existing = state.logs[key];
      return {
        ...state,
        logs: {
          ...state.logs,
          [key]: existing
            ? { ...existing, note: action.note }
            : {
                habitId: action.habitId,
                date: action.date,
                completed: false,
                note: action.note,
                xpAwarded: 0,
                completedAt: new Date().toISOString(),
              },
        },
      };
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
          celebratedMilestones: {
            ...state.coachState.celebratedMilestones,
            [action.habitId]: [...existing, action.streak],
          },
        },
      };
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  todayStats: { total: number; completed: number; percent: number };
  levelProgress: ReturnType<typeof levelFromXp>;
  overallStreak: number;
  signIn: (name: string, email: string, seedSampleData?: boolean) => void;
  signOut: () => void;
  resetDemo: () => void;
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
  return { ...raw, coachState: raw.coachState ?? { celebratedMilestones: {} } };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => migrateState(storage.get<AppState>(STATE_KEY, emptyState())));
  const toast = useToast();
  const prevAchievementCount = useRef(state.achievements.length);

  useEffect(() => {
    storage.set(STATE_KEY, state);
  }, [state]);

  // Game-engine effect: after any state change, check for newly unlocked
  // achievements and newly completed challenges, then react with toasts.
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const newlyUnlocked = findNewlyUnlockedAchievements(state);
    if (newlyUnlocked.length > 0) {
      dispatch({ type: 'UNLOCK_ACHIEVEMENTS', ids: newlyUnlocked.map((a) => a.id), defs: newlyUnlocked });
    }

    const newlyCompleted = state.challenges.filter((c) => {
      if (c.completedAt) return false;
      const progress = computeChallengeProgress(c, state.habits, state.logs);
      return progress.isSuccessful;
    });
    if (newlyCompleted.length > 0) {
      dispatch({ type: 'COMPLETE_CHALLENGES', ids: newlyCompleted.map((c) => c.id) });
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

  const signIn = useCallback((name: string, email: string, seedSampleData = true) => {
    dispatch({ type: 'SIGN_IN', name, email, seedSampleData });
  }, []);
  const signOut = useCallback(() => dispatch({ type: 'SIGN_OUT' }), []);
  const resetDemo = useCallback(() => dispatch({ type: 'RESET_DEMO' }), []);

  const addHabit: AppContextValue['addHabit'] = useCallback((input) => {
    dispatch({
      type: 'ADD_HABIT',
      habit: {
        id: generateId('habit'),
        archived: false,
        createdAt: todayISO(),
        ...input,
      },
    });
  }, []);

  const updateHabit = useCallback((habit: Habit) => dispatch({ type: 'UPDATE_HABIT', habit }), []);
  const deleteHabit = useCallback((habitId: string) => dispatch({ type: 'DELETE_HABIT', habitId }), []);
  const archiveHabit = useCallback((habitId: string, archived: boolean) => dispatch({ type: 'ARCHIVE_HABIT', habitId, archived }), []);

  const toggleLog = useCallback(
    (habitId: string, date: string) => {
      const key = logKey(habitId, date);
      const wasCompleted = state.logs[key]?.completed ?? false;
      dispatch({ type: 'TOGGLE_LOG', habitId, date });
      if (!wasCompleted) {
        const habit = state.habits.find((h) => h.id === habitId);
        if (habit) {
          const streak = computeHabitStreak(habit, state.logs, date) + 1;
          toast.push({
            type: 'xp',
            title: `${habit.emoji} ${habit.name} complete!`,
            description: streak > 1 ? `${streak}-day streak · +${xpForCompletion(streak)} XP` : `+${xpForCompletion(streak)} XP`,
          });
        }
      }
    },
    [state.logs, state.habits, toast]
  );

  const setLogNote = useCallback((habitId: string, date: string, note: string) => {
    dispatch({ type: 'SET_NOTE', habitId, date, note });
  }, []);

  const joinTemplateChallenge = useCallback(
    (templateId: ChallengeTemplateId, habitIds: string[]) => {
      const tpl = CHALLENGE_TEMPLATES.find((t) => t.templateId === templateId);
      if (!tpl) return;
      dispatch({
        type: 'JOIN_TEMPLATE_CHALLENGE',
        challenge: {
          id: generateId('challenge'),
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
        },
      });
      toast.push({ type: 'success', title: `Joined: ${tpl.title}`, description: 'Good luck — consistency is the whole game.' });
    },
    [toast]
  );

  const createCustomChallenge: AppContextValue['createCustomChallenge'] = useCallback(
    (input) => {
      dispatch({
        type: 'CREATE_CUSTOM_CHALLENGE',
        challenge: {
          id: generateId('challenge'),
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
        },
      });
      toast.push({ type: 'success', title: `Custom challenge created: ${input.title}` });
    },
    [toast]
  );

  const leaveChallenge = useCallback((challengeId: string) => dispatch({ type: 'LEAVE_CHALLENGE', challengeId }), []);
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
    const activeHabitIds = state.habits.filter((h) => !h.archived).map((h) => h.id);
    if (activeHabitIds.length === 0) return;
    dispatch({
      type: 'CREATE_CUSTOM_CHALLENGE',
      challenge: {
        id: generateId('challenge'),
        title: 'Iron Will Challenge',
        description: "Complete every habit, every day, for a full week. Coach Nova's toughest challenge.",
        emoji: '🛡️',
        durationDays: 7,
        startDate: todayISO(),
        habitIds: activeHabitIds,
        templateId: 'custom',
        xpReward: 150,
        badgeEmoji: '🛡️',
        completedAt: null,
        joined: true,
      },
    });
    toast.push({ type: 'success', title: 'Iron Will Challenge accepted!', description: '🛡️ Complete every habit for 7 days straight.' });
  }, [state.habits, toast]);

  const value: AppContextValue = {
    state,
    todayStats,
    levelProgress,
    overallStreak,
    signIn,
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
