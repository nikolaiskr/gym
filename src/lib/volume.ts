import type { ExerciseDef, MuscleGroup, Workout } from '@/types';
import { heatColor } from '@/lib/heat';

// Подходы по мышцам за период: основные = 1, вторичные = 0.5
export function muscleVolume(
  workouts: Workout[],
  since: number,
  exerciseLookup: (id: string) => ExerciseDef | undefined,
): Record<string, number> {
  const vol: Record<string, number> = {};
  for (const w of workouts) {
    if (!w.endedAt || w.endedAt < since) continue;
    for (const we of w.exercises) {
      const def = exerciseLookup(we.exerciseId);
      if (!def) continue;
      const n = we.sets.length;
      def.primary.forEach((m) => { vol[m] = (vol[m] ?? 0) + n; });
      def.secondary.forEach((m) => { vol[m] = (vol[m] ?? 0) + n * 0.5; });
    }
  }
  return vol;
}

// Объём одной тренировки (для мини-карты в истории)
export function workoutMuscleVolume(
  workout: Workout,
  exerciseLookup: (id: string) => ExerciseDef | undefined,
): Record<string, number> {
  return muscleVolume([workout], 0, exerciseLookup);
}

export function heatColorFor(vol: Record<string, number>): (m: MuscleGroup) => string | null {
  const max = Math.max(1, ...Object.values(vol));
  return (m) => {
    const v = vol[m] ?? 0;
    if (v <= 0) return null; // без нагрузки пятно не рисуем
    return heatColor(0.15 + 0.85 * (v / max));
  };
}
