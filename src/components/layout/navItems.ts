export interface NavItem {
  to: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/challenges', label: 'Challenges', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '⚙️' },
];
