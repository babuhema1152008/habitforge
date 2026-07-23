import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppProvider';
import { AppShell } from '@/components/layout/AppShell';

export function ProtectedRoute() {
  const { state, authReady } = useApp();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-subtle dark:bg-surface-dark">
        <span className="text-2xl animate-pulse" aria-hidden="true">🔥</span>
      </div>
    );
  }

  if (!state.isAuthenticated) return <Navigate to="/auth?mode=login" replace />;
  return <AppShell />;
}
