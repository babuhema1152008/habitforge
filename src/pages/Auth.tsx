import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { supabase } from '@/lib/supabaseClient';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/demoAccount';

function friendlyAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (/rate limit/i.test(message)) {
    return "Too many attempts right now — Supabase's email sending has a rate limit. If you're the project owner, turning off \"Confirm email\" under Authentication → Providers → Email removes this limit entirely (no email is sent). Otherwise, wait a few minutes and try again.";
  }
  if (/email not confirmed/i.test(message)) {
    return 'This account still needs email confirmation. Check your inbox, or ask the project owner to disable "Confirm email" in Supabase.';
  }
  return message || 'Something went wrong. Please try again.';
}

export function Auth() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'login' ? 'login' : 'signup';
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  function switchMode(next: 'login' | 'signup') {
    setParams({ mode: next });
    setError('');
    setInfo('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password.trim() || (isSignup && !name.trim())) {
      setError('Please fill in every field.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo("Account created — check your email to confirm it, then log in.");
          setSubmitting(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemo() {
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          options: { data: { name: 'Demo User' } },
        });
        if (signUpError) throw signUpError;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
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

            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                {info}
              </p>
            )}

            <Button type="submit" fullWidth size="lg" disabled={submitting}>
              {submitting ? 'Please wait…' : isSignup ? 'Create Account' : 'Log In'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <Button variant="outline" fullWidth onClick={handleDemo} disabled={submitting}>
            🚀 Try the Demo (no signup)
          </Button>

          <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
            Real accounts, backed by Supabase — your data syncs across devices and keeps working offline.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
