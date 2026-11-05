import { epley1RM, ema, trendStatus, detectPRs, analyzeExercise, weekKey } from '../src/lib/analytics';
import type { Workout } from '../src/types';

let fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${name}`);
};

// Эпли
eq('epley 100x1', epley1RM(100, 1), 100);
eq('epley 100x10', Math.round(epley1RM(100, 10) * 100) / 100, 133.33);
eq('epley 0 reps', epley1RM(100, 0), 0);

// EMA
eq('ema single', ema([10]), 10);
eq('ema two', ema([10, 20], 0.5), 15);

// helpers для тренировок
const mk = (day: number, exId: string, weight: number, reps: number): Workout => ({
  id: `w${day}-${exId}-${weight}-${reps}`,
  startedAt: day,
  endedAt: day + 3600_000,
  exercises: [{ exerciseId: exId, sets: [{ id: 's', weight, reps, doneAt: day }] }],
  prs: [],
});
const D = 86_400_000;
const t0 = Date.UTC(2026, 0, 1);

// растущий тренд
const growing = [0, 1, 2, 3, 4, 5].map((i) => mk(t0 + i * D, 'ex', 100 + i * 5, 5));
eq('status growing', analyzeExercise(growing, 'ex').status, 'growing');

// плато
const flat = [0, 1, 2, 3, 4, 5].map((i) => mk(t0 + i * D, 'ex', 100, 5));
eq('status plateau', analyzeExercise(flat, 'ex').status, 'plateau');

// падающий
const falling = [0, 1, 2, 3, 4, 5].map((i) => mk(t0 + i * D, 'ex', 130 - i * 5, 5));
eq('status falling', analyzeExercise(falling, 'ex').status, 'falling');

// уверенность
eq('confidence low', analyzeExercise([mk(t0, 'ex', 100, 5), mk(t0 + D, 'ex', 100, 5)], 'ex').confidence, 'low');
eq('confidence high', analyzeExercise(growing, 'ex').confidence, 'high');

// PR: первая сессия — без PR
eq('no PR without history', detectPRs([], 'ex', 100, 5).types.length, 0);
// рекорд веса
eq('PR weight', detectPRs([mk(t0, 'ex', 100, 5)], 'ex', 105, 3).types.includes('weight'), true);
// рекорд повторов при том же весе
eq('PR reps', detectPRs([mk(t0, 'ex', 100, 5)], 'ex', 100, 7).types.includes('reps'), true);
// рекорд e1rm без рекорда веса: 95x12 vs 100x5 (e1rm 126.7 vs 116.7)
eq('PR e1rm', detectPRs([mk(t0, 'ex', 100, 5)], 'ex', 95, 12).types.includes('e1rm'), true);
// не рекорд
eq('no PR lower', detectPRs([mk(t0, 'ex', 100, 5)], 'ex', 90, 5).types.length, 0);

// weekKey формат
eq('weekKey', /^20\d\d-W\d{2}$/.test(weekKey(t0)), true);

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURES`);
