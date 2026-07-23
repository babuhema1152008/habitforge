// Framework-agnostic sync engine: pushes queued local mutations to Supabase and
// pulls remote rows back down. AppProvider owns the queue (as part of AppState,
// so it persists to localStorage automatically) and calls these functions.
import { supabase } from '@/lib/supabaseClient';
import { generateId } from '@/lib/id';
import type { Achievement, Challenge, Habit, HabitLog, SyncTable, SyncTask } from '@/types';
import {
  challengeToRow,
  habitLogToRow,
  habitToRow,
  rowToAchievement,
  rowToChallenge,
  rowToHabit,
  rowToHabitLog,
  rowToProfilePatch,
  type DbRow,
  type ProfilePatch,
} from '@/lib/sync/mappers';

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function onConnectivityChange(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

export function createTask(table: SyncTable, op: SyncTask['op'], payload: DbRow): SyncTask {
  return { id: generateId(), table, op, payload, createdAt: new Date().toISOString() };
}

const CONFLICT_KEY: Partial<Record<SyncTable, string>> = {
  habit_logs: 'habit_id,date',
};

async function pushOne(task: SyncTask): Promise<void> {
  if (task.op === 'delete') {
    const { error } = await supabase.from(task.table).delete().eq('id', task.payload.id as string);
    if (error) throw error;
    return;
  }
  const onConflict = CONFLICT_KEY[task.table];
  const query = supabase.from(task.table);
  const { error } = onConflict ? await query.upsert(task.payload, { onConflict }) : await query.upsert(task.payload);
  if (error) throw error;
}

/** Pushes queued tasks in order; stops at the first failure so ordering/dependencies are preserved. */
export async function flush(queue: SyncTask[]): Promise<{ succeededIds: string[]; failed: boolean }> {
  const succeededIds: string[] = [];
  for (const task of queue) {
    try {
      await pushOne(task);
      succeededIds.push(task.id);
    } catch {
      return { succeededIds, failed: true };
    }
  }
  return { succeededIds, failed: false };
}

export interface PulledData {
  habits: Habit[];
  logs: HabitLog[];
  challenges: Challenge[];
  achievements: Achievement[];
  profile: ProfilePatch | null;
}

export async function pullAll(userId: string, email: string): Promise<PulledData> {
  const [habitsRes, logsRes, challengesRes, achievementsRes, profileRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('habit_logs').select('*').eq('user_id', userId),
    supabase.from('challenges').select('*').eq('user_id', userId),
    supabase.from('achievements').select('*').eq('user_id', userId),
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
  ]);

  for (const res of [habitsRes, logsRes, challengesRes, achievementsRes, profileRes]) {
    if (res.error) throw res.error;
  }

  const habits = ((habitsRes.data ?? []) as DbRow[]).map(rowToHabit).filter((h) => !h.deletedAt);
  const challenges = ((challengesRes.data ?? []) as DbRow[]).map(rowToChallenge).filter((c) => !c.deletedAt);
  const logs = ((logsRes.data ?? []) as DbRow[]).map(rowToHabitLog);
  const achievements = ((achievementsRes.data ?? []) as DbRow[]).map(rowToAchievement);
  const profile = profileRes.data ? rowToProfilePatch(profileRes.data as DbRow, email) : null;

  return { habits, logs, challenges, achievements, profile };
}

/** Wipes and re-inserts a user's habits/logs/challenges (used by "Reset to Demo Data"). */
export async function reseedRemote(
  userId: string,
  data: { habits: Habit[]; logs: HabitLog[]; challenges: Challenge[] }
): Promise<void> {
  await Promise.all([
    supabase.from('challenges').delete().eq('user_id', userId),
    supabase.from('achievements').delete().eq('user_id', userId),
  ]);
  // Deleting habits cascades to habit_logs via the FK, so this also clears old logs.
  await supabase.from('habits').delete().eq('user_id', userId);

  if (data.habits.length > 0) {
    const { error } = await supabase.from('habits').insert(data.habits.map((h) => habitToRow(h, userId)));
    if (error) throw error;
  }
  if (data.challenges.length > 0) {
    const { error } = await supabase.from('challenges').insert(data.challenges.map((c) => challengeToRow(c, userId)));
    if (error) throw error;
  }
  if (data.logs.length > 0) {
    const { error } = await supabase.from('habit_logs').insert(data.logs.map((l) => habitLogToRow(l, userId)));
    if (error) throw error;
  }
}
