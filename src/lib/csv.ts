import type { Habit, HabitLog } from '@/types';

export function habitsToCsv(habits: Habit[], logs: Record<string, HabitLog>): string {
  const rows: string[] = ['Habit,Category,Date,Completed,Note'];
  const logList = Object.values(logs).sort((a, b) => a.date.localeCompare(b.date));
  for (const log of logList) {
    const habit = habits.find((h) => h.id === log.habitId);
    if (!habit) continue;
    const note = (log.note ?? '').replace(/"/g, '""');
    rows.push(`"${habit.name}","${habit.category}","${log.date}","${log.completed}","${note}"`);
  }
  return rows.join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
