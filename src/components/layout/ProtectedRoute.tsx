import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppProvider';
import { AppShell } from '@/components/layout/AppShell';

export function ProtectedRoute() {
  const { state } = useApp();
  if (!state.isAuthenticated) return <Navigate to="/auth?mode=login" replace />;
  return <AppShell />;
}
