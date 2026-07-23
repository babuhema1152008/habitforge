import type { CategoryMeta, HabitCategory } from '@/types';

export const CATEGORIES: Record<HabitCategory, CategoryMeta> = {
  health: { label: 'Health', emoji: '💧', color: '#14b8a6' },
  fitness: { label: 'Fitness', emoji: '💪', color: '#f43f5e' },
  mindfulness: { label: 'Mindfulness', emoji: '🧘', color: '#8b5cf6' },
  productivity: { label: 'Productivity', emoji: '✅', color: '#4f46e5' },
  learning: { label: 'Learning', emoji: '📚', color: '#f59e0b' },
  finance: { label: 'Finance', emoji: '💰', color: '#22c55e' },
  social: { label: 'Social', emoji: '🤝', color: '#0ea5e9' },
  other: { label: 'Other', emoji: '⭐', color: '#64748b' },
};

export const CATEGORY_ORDER: HabitCategory[] = [
  'health',
  'fitness',
  'mindfulness',
  'productivity',
  'learning',
  'finance',
  'social',
  'other',
];

export const HABIT_EMOJI_PRESETS = [
  '💧', '🏃', '💪', '🧘', '📖', '🐍', '🎯', '🥗', '😴', '🚭',
  '💰', '🎨', '🎸', '📝', '🧹', '☀️', '🌙', '🙏', '📵', '🚶',
];
