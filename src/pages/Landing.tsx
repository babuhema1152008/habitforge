import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

const FEATURES = [
  {
    emoji: '⚡',
    title: 'Check off in under 3 seconds',
    description: 'One tap marks a habit done. No forms, no friction — just tap and get instant feedback.',
  },
  {
    emoji: '🔥',
    title: 'Streaks that keep you honest',
    description: 'Every habit tracks its own streak, and your overall streak grows on perfect days.',
  },
  {
    emoji: '⭐',
    title: 'XP, levels & badges',
    description: 'Earn XP for every completion, level up, and unlock achievements as you stay consistent.',
  },
  {
    emoji: '📊',
    title: 'Calendar & analytics',
    description: 'See a full monthly heatmap and charts that break down your progress by category.',
  },
  {
    emoji: '🏆',
    title: '7/21/30-day challenges',
    description: 'Commit to a challenge, track your progress bar, and earn a badge when you finish.',
  },
  {
    emoji: '🌗',
    title: 'Light & dark, fully responsive',
    description: 'A clean, Notion-inspired interface that looks great on phone, tablet, and desktop.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya N.',
    role: 'Product Designer',
    quote: 'The 3-second check-in is the whole reason this stuck for me. Every other tracker felt like homework.',
    emoji: '🦋',
  },
  {
    name: 'Marcus T.',
    role: 'Software Engineer',
    quote: "I'm on a 47-day meditation streak. Watching the XP bar fill up shouldn't be this motivating, but here we are.",
    emoji: '🐢',
  },
  {
    name: 'Sasha K.',
    role: 'Grad Student',
    quote: 'The 21-Day Habit Builder challenge finally got me to stick with studying every morning before class.',
    emoji: '🦉',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-subtle dark:bg-surface-dark">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] opacity-70 dark:opacity-40"
          style={{
            background:
              'radial-gradient(600px circle at 20% 0%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(500px circle at 85% 10%, rgba(20,184,166,0.16), transparent 55%)',
          }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              🔥 Build habits that actually stick
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Track your habits.
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-accent-teal bg-clip-text text-transparent">
                Level up your life.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              HabitForge makes daily consistency feel rewarding — mark a habit done in seconds, watch your streak
              grow, and earn XP every single day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/auth?mode=signup')}>
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth?mode=login')}>
                Log In
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">No credit card. No backend required — your data stays on your device.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Today</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">3 of 5 habits done</p>
                </div>
                <span className="rounded-full bg-accent-amber/15 px-3 py-1 text-xs font-bold text-accent-amber">Level 6</span>
              </div>
              <ProgressBar percent={60} colorClassName="bg-gradient-to-r from-brand-500 to-accent-teal" />
              <div className="mt-5 space-y-2.5">
                {[
                  { emoji: '💧', name: 'Drink Water', done: true },
                  { emoji: '💪', name: 'Exercise', done: true },
                  { emoji: '🧘', name: 'Meditate', done: true },
                  { emoji: '📖', name: 'Read 20 Minutes', done: false },
                  { emoji: '🐍', name: 'Study Python', done: false },
                ].map((h) => (
                  <div key={h.name} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
                    <span className="text-lg" aria-hidden="true">{h.emoji}</span>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{h.name}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        h.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {h.done && '✓'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" id="features">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Everything you need. Nothing you don't.</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            HabitForge is built around one loop: check in, get rewarded, come back tomorrow.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full p-5">
                <span className="text-2xl" aria-hidden="true">{f.emoji}</span>
                <h3 className="mt-3 font-bold text-slate-800 dark:text-slate-100">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{f.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16 dark:bg-surface-darkCard/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center text-3xl font-extrabold text-slate-900 dark:text-white"
          >
            Loved by consistency seekers
          </motion.h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="h-full p-6">
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-lg dark:bg-brand-500/15">
                      {t.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-xl2 bg-gradient-to-br from-brand-600 to-accent-teal px-6 py-14 text-center shadow-card sm:px-12"
        >
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Start your streak today</h2>
          <p className="mx-auto mt-3 max-w-md text-brand-50">
            It takes less than a minute to set up your first habit. Your future self will thank you.
          </p>
          <Button
            size="lg"
            className="mt-7 bg-white text-brand-700 hover:bg-brand-50"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Create Your Free Account
          </Button>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
        <p>© {new Date().getFullYear()} HabitForge. Built for people who show up.</p>
      </footer>
    </div>
  );
}
