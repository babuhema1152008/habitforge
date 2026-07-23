// Fixed credentials for the "Try the Demo" shared sandbox account. Anyone can
// sign into this account and its data can be reset by anyone — that's the
// deliberate tradeoff of a zero-friction, real (not purely local) demo.
//
// Domain note: Supabase's signup validation rejected `habitforge.app` (a
// domain that isn't actually registered/resolvable) as an invalid address.
// gmail.com is guaranteed to pass that check, and since no email is ever
// actually sent to it once "Confirm email" is off, real deliverability
// doesn't matter here.
export const DEMO_EMAIL = 'habitforge.demo.account@gmail.com';
export const DEMO_PASSWORD = 'HabitForgeDemo!2026';
