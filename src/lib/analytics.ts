import type {
  Confidence,
  ExerciseAnalytics,
  SessionBest,
  SetEntry,
  TrendStatus,
  Workout,
  WorkoutPr,
  PrType,
} from '@/types';

// ─── Формула Эпли ─────────────────────────────────────────────────
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function setE1rm(s: SetEntry): number {
  return epley1RM(s.weight, s.reps);
}

// ─── EMA (экспоненциальное среднее) ───────────────────────────────
export function ema(values: number[], alpha = 0.5): number {
  if (values.length === 0) return 0;
  let acc = values[0];
  for (let i = 1; i < values.length; i++) acc = alpha * values[i] + (1 - alpha) * acc;
  return acc;
}

// ─── Лучшие показатели по сессиям ─────────────────────────────────
export function sessionBests(workouts: Workout[], exerciseId: string): SessionBest[] {
  const out: SessionBest[] = [];
  for (const w of workouts) {
    if (!w.endedAt) continue;
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex || ex.sets.length === 0) continue;
    let bestE1rm = 0;
    let topWeight = 0;
    let topReps = 0;
    for (const s of ex.sets) {
      bestE1rm = Math.max(bestE1rm, setE1rm(s));
      topWeight = Math.max(topWeight, s.weight);
      topReps = Math.max(topReps, s.reps);
    }
    out.push({ date: w.endedAt, bestE1rm, topWeight, topReps });
  }
  return out.sort((a, b) => a.date - b.date);
}

// ─── Статус упражнения по EMA 1RM ─────────────────────────────────
// Сравниваем EMA последних 3 сессий с EMA предшествующих сессий:
// перекрывающиеся окна «3 из 6» почти нечувствительны к плавному тренду,
// поэтому базой служат именно более ранние сессии.
export function trendStatus(sessions: SessionBest[]): { status: TrendStatus | null; confidence: Confidence } {
  const n = sessions.length;
  const confidence: Confidence = n < 3 ? 'low' : n < 6 ? 'medium' : 'high';
  if (n < 2) return { status: null, confidence };
  const vals = sessions.map((s) => s.bestE1rm);
  const k = n >= 4 ? 3 : 1;
  const recent = ema(vals.slice(-k));
  const base = ema(vals.slice(0, n - k));
  const diff = base === 0 ? 0 : (recent - base) / base;
  if (diff > 0.015) return { status: 'growing', confidence };
  if (diff < -0.015) return { status: 'falling', confidence };
  return { status: 'plateau', confidence };
}

// ─── Рекомендация «Далее» ─────────────────────────────────────────
export function recommendation(status: TrendStatus | null, confidence: Confidence): string {
  if (status === null) return 'Пока данных мало — отработайте технику и запишите ещё 2–3 сессии.';
  if (status === 'plateau') {
    return confidence === 'high'
      ? 'Вес тот же, добавь 1–2 повтора в подходах, затем увеличь нагрузку.'
      : 'Держите вес, добавьте 1–2 повтора в подходах, затем увеличьте нагрузку.';
  }
  if (status === 'growing') {
    return 'Прибавки делай маленькими и повторяемыми: +2,5 кг, пока техника стабильна.';
  }
  return 'Снизьте вес на 5–10% на 1–2 недели (разгрузка), затем возвращайтесь постепенно.';
}

// ─── Детект PR ────────────────────────────────────────────────────
// Сравниваем новый подход с историей ДО текущей тренировки.
export interface PrHit {
  types: PrType[];
  prs: WorkoutPr[];
}

export function detectPRs(
  history: Workout[], // завершённые тренировки до текущей
  exerciseId: string,
  weight: number,
  reps: number,
): PrHit {
  let maxWeight = 0;
  let maxE1rm = 0;
  for (const w of history) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    for (const s of ex.sets) {
      maxWeight = Math.max(maxWeight, s.weight);
      maxE1rm = Math.max(maxE1rm, setE1rm(s));
    }
  }
  const types: PrType[] = [];
  const prs: WorkoutPr[] = [];
  const e1 = epley1RM(weight, reps);
  // рекорд веса — только если история уже была (первый подход упражнения не PR)
  const hasHistory = maxWeight > 0 || maxE1rm > 0;
  if (hasHistory && weight > maxWeight) {
    types.push('weight');
    prs.push({ exerciseId, type: 'weight', value: weight, reps });
  }
  // рекорд повторов при этом весе (вес уже встречался в истории)
  const prevRepsAtWeight = bestRepsAtWeight(history, exerciseId, weight);
  if (hasHistory && prevRepsAtWeight > 0 && reps > prevRepsAtWeight) {
    types.push('reps');
    prs.push({ exerciseId, type: 'reps', value: reps, weight });
  }
  if (hasHistory && e1 > maxE1rm) {
    types.push('e1rm');
    prs.push({ exerciseId, type: 'e1rm', value: Math.round(e1 * 10) / 10, weight, reps });
  }
  return { types, prs };
}

function bestRepsAtWeight(history: Workout[], exerciseId: string, weight: number): number {
  let best = 0;
  for (const w of history) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    for (const s of ex.sets) {
      if (s.weight === weight) best = Math.max(best, s.reps);
    }
  }
  return best;
}

// ─── Полная аналитика упражнения ──────────────────────────────────
export function analyzeExercise(workouts: Workout[], exerciseId: string): ExerciseAnalytics {
  const sessions = sessionBests(workouts, exerciseId);
  const { status, confidence } = trendStatus(sessions);
  let bestSet: SetEntry | null = null;
  let lastSet: SetEntry | null = null;
  let maxWeight = 0;
  let maxWeightReps = 0;
  let maxE1rm = 0;
  const done = workouts.filter((w) => w.endedAt).sort((a, b) => (a.endedAt! - b.endedAt!));
  for (const w of done) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    for (const s of ex.sets) {
      if (!bestSet || setE1rm(s) > setE1rm(bestSet)) bestSet = s;
      lastSet = s;
      if (s.weight > maxWeight) {
        maxWeight = s.weight;
        maxWeightReps = s.reps;
      }
      maxE1rm = Math.max(maxE1rm, setE1rm(s));
    }
  }
  return {
    status,
    confidence,
    sessions,
    bestSet,
    lastSet,
    recommendation: recommendation(status, confidence),
    prs: { maxWeight, maxWeightReps, maxE1rm: Math.round(maxE1rm * 10) / 10 },
  };
}

// ─── Вспомогательные ──────────────────────────────────────────────
export function workoutTonnage(w: Workout): number {
  return w.exercises.reduce(
    (acc, e) => acc + e.sets.reduce((a, s) => a + s.weight * s.reps, 0),
    0,
  );
}

export function workoutSetCount(w: Workout): number {
  return w.exercises.reduce((acc, e) => acc + e.sets.length, 0);
}

export function formatDuration(start: number, end: number): string {
  const min = Math.max(1, Math.round((end - start) / 60000));
  if (min < 60) return `${min} мин`;
  return `${Math.floor(min / 60)} ч ${min % 60} мин`;
}

export function formatKg(v: number): string {
  const r = Math.round(v);
  return r.toLocaleString('ru-RU');
}

// ISO-неделя (ключ вида 2026-W45)
export function weekKey(ts: number): string {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7; // понедельник = 0
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const ftDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - ftDay + 3);
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${thursday.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
