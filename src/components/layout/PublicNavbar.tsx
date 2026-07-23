import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useApp } from '@/context/AppProvider';

export function PublicNavbar() {
  const navigate = useNavigate();
  const { state } = useApp();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-surface-dark/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          <span className="text-xl" aria-hidden="true">🔥</span>
          HabitForge
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {state.isAuthenticated ? (
            <Button size="sm" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/auth?mode=login')}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate('/auth?mode=signup')}>
                Get Started Free
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
