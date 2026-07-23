import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Landing } from '@/pages/Landing';
import { Auth } from '@/pages/Auth';
import { Dashboard } from '@/pages/Dashboard';
import { CalendarAnalytics } from '@/pages/CalendarAnalytics';
import { Challenges } from '@/pages/Challenges';
import { Profile } from '@/pages/Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarAnalytics />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
