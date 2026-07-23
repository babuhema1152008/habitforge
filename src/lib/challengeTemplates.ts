import type { ChallengeTemplateId } from '@/types';

export interface ChallengeTemplate {
  templateId: ChallengeTemplateId;
  title: string;
  description: string;
  emoji: string;
  durationDays: number;
  xpReward: number;
  badgeEmoji: string;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    templateId: '7-day',
    title: '7-Day Consistency Challenge',
    description: 'Complete this habit every applicable day for one week straight.',
    emoji: '🚀',
    durationDays: 7,
    xpReward: 100,
    badgeEmoji: '🚀',
  },
  {
    templateId: '21-day',
    title: '21-Day Habit Builder',
    description: 'Psychologists say 21 days is where a habit starts sticking. Prove it.',
    emoji: '🧠',
    durationDays: 21,
    xpReward: 300,
    badgeEmoji: '🧠',
  },
  {
    templateId: '30-day',
    title: '30-Day Productivity Challenge',
    description: 'A full month of consistency. This is where transformation happens.',
    emoji: '🏆',
    durationDays: 30,
    xpReward: 500,
    badgeEmoji: '🏆',
  },
];
