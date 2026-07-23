import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CoachAction } from '@/types';
import { todayISO } from '@/lib/date';
import { useApp } from '@/context/AppProvider';

/** Resolves a CoachAction (declarative, produced by the pure coach engine) into a real side effect. */
export function useCoachActions() {
  const { toggleLog, acceptIronWillChallenge } = useApp();
  const navigate = useNavigate();

  return useCallback(
    (action: CoachAction) => {
      switch (action.kind) {
        case 'complete-habit':
          if (action.habitId) toggleLog(action.habitId, todayISO());
          break;
        case 'start-iron-will-challenge':
          acceptIronWillChallenge();
          break;
        case 'view-calendar':
          navigate('/calendar');
          break;
        case 'view-challenges':
          navigate('/challenges');
          break;
      }
    },
    [toggleLog, acceptIronWillChallenge, navigate]
  );
}
