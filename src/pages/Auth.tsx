import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useApp } from '@/context/AppProvider';

export function Auth() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'login' ? 'login' : 'signup';
  const navigate = useNavigate();
  const { signIn } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [seedSample, setSeedSample] = useState(true);
  const [error, setError] = useState('');

  const isSignup = mode === 'signup';

  function switchMode(next: 'login' | 'signup') {
    setParams({ mode: next });
    setError('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (isSignup && !name.trim())) {
      setError('Please fill in every field.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    signIn(name.trim() || email.split('@')[0], email.trim(), isSignup ? seedSample : true);
    navigate('/dashboard');
  }

  function handleDemo() {
    signIn('Demo User', 'demo@habitforge.app', true);
    navigate('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4 py-10 dark:bg-surface-dark">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-extrabold text-slate-800 dark:text-slate-100">
          <span aria-hidden="true">🔥</span> HabitForge
        </Link>

        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              className={`focus-ring flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                isSignup ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'
              }`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
            <button
              className={`focus-ring flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                !isSignup ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'
              }`}
              onClick={() => switchMode('login')}
            >
              Log In
            </button>
          </div>

          <h1 className="mb-1 text-xl font-bold text-slate-800 dark:text-slate-100">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            {isSignup ? 'Start building habits that stick, in under a minute.' : 'Log in to keep your streak alive.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {isSignup && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Lee"
                  className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            {isSignup && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={seedSample}
                  onChange={(e) => setSeedSample(e.target.checked)}
                  className="focus-ring h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                Start with sample habits &amp; demo progress
              </label>
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth size="lg">
              {isSignup ? 'Create Account' : 'Log In'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <Button variant="outline" fullWidth onClick={handleDemo}>
            🚀 Try the Demo (no signup)
          </Button>

          <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
            This is a local demo — data is stored only in your browser, no account is created on a server.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
