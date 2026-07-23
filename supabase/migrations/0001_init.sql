-- HabitForge — initial schema
-- Run this once in the Supabase Dashboard: SQL Editor > New query > paste > Run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  avatar_emoji text not null default '🦊',
  avatar_color text not null default '#4f46e5',
  xp integer not null default 0,
  level integer not null default 1,
  best_overall_streak integer not null default 0,
  settings jsonb not null default '{"theme":"light","weekStartsOn":0,"reminderNotesEnabled":true}',
  coach_state jsonb not null default '{"celebratedMilestones":{}}',
  last_celebrated_perfect_day date,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- habits
-- ---------------------------------------------------------------------------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null,
  category text not null,
  color text not null,
  target_days smallint[] not null default '{0,1,2,3,4,5,6}',
  reminder_time time,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index habits_user_id_idx on public.habits(user_id);

-- ---------------------------------------------------------------------------
-- habit_logs
-- ---------------------------------------------------------------------------
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  note text,
  xp_awarded integer not null default 0,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index habit_logs_user_id_idx on public.habit_logs(user_id);
create index habit_logs_habit_id_idx on public.habit_logs(habit_id);

-- ---------------------------------------------------------------------------
-- challenges (habit_ids kept as an array column rather than a join table —
-- simpler to sync for this app's scale and access pattern)
-- ---------------------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  emoji text not null,
  template_id text not null,
  duration_days integer not null,
  start_date date not null,
  habit_ids uuid[] not null default '{}',
  xp_reward integer not null default 0,
  badge_emoji text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index challenges_user_id_idx on public.challenges(user_id);

-- ---------------------------------------------------------------------------
-- achievements
-- ---------------------------------------------------------------------------
create table public.achievements (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (id, user_id)
);

-- ---------------------------------------------------------------------------
-- updated_at auto-touch trigger (safety net for correct last-write-wins sync)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.habits
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.habit_logs
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.challenges
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auto-create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security — every user can only ever see/touch their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.challenges enable row level security;
alter table public.achievements enable row level security;

create policy "profiles are self-access only" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "habits are self-access only" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habit_logs are self-access only" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "challenges are self-access only" on public.challenges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "achievements are self-access only" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
