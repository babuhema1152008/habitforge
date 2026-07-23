import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AchievementsGrid } from '@/components/profile/AchievementsGrid';
import { useTheme } from '@/context/ThemeProvider';
import { useApp } from '@/context/AppProvider';
import { habitsToCsv, downloadCsv } from '@/lib/csv';

const AVATAR_EMOJIS = ['🦊', '🐼', '🦉', '🐨', '🐯', '🦁', '🐸', '🐢', '🐧', '🦄'];
const AVATAR_COLORS = ['#4f46e5', '#14b8a6', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9', '#22c55e'];

export function Profile() {
  const { state, updateProfile, updateSettings, signOut, resetDemo, levelProgress, overallStreak } = useApp();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    updateProfile({ name: name.trim() || state.user.name, email: email.trim() || state.user.email });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    const csv = habitsToCsv(state.habits, state.logs);
    downloadCsv(`habitforge-export-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function handleSignOut() {
    signOut();
    navigate('/');
  }

  async function handleReset() {
    if (!window.confirm('Reset to fresh demo data? This replaces your current habits, logs, and XP everywhere it has synced.')) return;
    setResetting(true);
    try {
      await resetDemo();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Profile & Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account, theme, and data.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar emoji={state.user.avatarEmoji} color={state.user.avatarColor} size={56} />
                <div className="flex-1">
                  <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Avatar icon</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_EMOJIS.map((e) => (
                      <button
                        type="button"
                        key={e}
                        onClick={() => updateProfile({ avatarEmoji: e })}
                        aria-pressed={state.user.avatarEmoji === e}
                        className={`focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-base ${
                          state.user.avatarEmoji === e ? 'bg-brand-600' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Avatar color</p>
                <div className="flex flex-wrap gap-1.5">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => updateProfile({ avatarColor: c })}
                      aria-pressed={state.user.avatarColor === c}
                      aria-label={`Avatar color ${c}`}
                      className={`h-7 w-7 rounded-full ${state.user.avatarColor === c ? 'ring-2 ring-offset-2 ring-brand-600 dark:ring-offset-surface-darkCard' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-name" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Name
                  </label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit">Save Changes</Button>
                {saved && <span className="text-xs font-semibold text-emerald-600">Saved ✓</span>}
              </div>
            </form>
          </Card>

          <AchievementsGrid />

          <Card className="p-5">
            <h2 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Data</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={handleExport}>
                ⬇ Export Progress as CSV
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={resetting}>
                {resetting ? 'Resetting…' : '↺ Reset to Demo Data'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Your data syncs to your account and is cached locally so the app keeps working offline. Exporting downloads a CSV of every habit completion.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-bold text-slate-800 dark:text-slate-100">Snapshot</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Level</span><span className="font-semibold text-slate-700 dark:text-slate-200">{levelProgress.level}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total XP</span><span className="font-semibold text-slate-700 dark:text-slate-200">{state.user.xp}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Current streak</span><span className="font-semibold text-slate-700 dark:text-slate-200">{overallStreak} days</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Best streak</span><span className="font-semibold text-slate-700 dark:text-slate-200">{Math.max(state.user.bestOverallStreak, overallStreak)} days</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Active habits</span><span className="font-semibold text-slate-700 dark:text-slate-200">{state.habits.filter((h) => !h.archived).length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Member since</span><span className="font-semibold text-slate-700 dark:text-slate-200">{new Date(state.user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span></div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-bold text-slate-800 dark:text-slate-100">Appearance</h3>
            <div className="flex gap-2">
              <Button variant={theme === 'light' ? 'primary' : 'outline'} size="sm" onClick={() => setTheme('light')}>
                ☀️ Light
              </Button>
              <Button variant={theme === 'dark' ? 'primary' : 'outline'} size="sm" onClick={() => setTheme('dark')}>
                🌙 Dark
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-bold text-slate-800 dark:text-slate-100">Preferences</h3>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Enable habit notes</span>
              <input
                type="checkbox"
                checked={state.settings.reminderNotesEnabled}
                onChange={(e) => updateSettings({ reminderNotesEnabled: e.target.checked })}
                className="focus-ring h-4 w-4 rounded border-slate-300 text-brand-600"
              />
            </label>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-bold text-slate-800 dark:text-slate-100">Account</h3>
            <Button variant="danger" fullWidth onClick={handleSignOut}>
              Sign Out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
