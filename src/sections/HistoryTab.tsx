import { useMemo, useState } from 'react';
import type { Workout } from '@/types';
import { useStore } from '@/lib/storage';
import { formatDuration, formatKg, workoutSetCount, workoutTonnage } from '@/lib/analytics';
import { workoutMuscleVolume, heatColorFor } from '@/lib/volume';
import { MuscleMiniMap } from '@/components/MuscleMap';
import { haptic } from '@/lib/telegram';

export function HistoryTab() {
  const { workouts } = useStore();
  const list = useMemo(
    () => [...workouts].filter((w) => w.endedAt).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0)),
    [workouts],
  );

  if (list.length === 0) {
    return (
      <div className="px-4 pt-16 text-center">
        <div className="text-5xl mb-3">📜</div>
        <h1 className="text-xl font-bold mb-2">История пуста</h1>
        <p className="hint">Завершённые тренировки появятся здесь.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-3">
      <h1 className="text-xl font-bold">История</h1>
      {list.map((w) => (
        <WorkoutCard key={w.id} workout={w} />
      ))}
    </div>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const { exerciseById } = useStore();
  const [open, setOpen] = useState(false);

  const date = new Date(workout.endedAt!);
  const sets = workoutSetCount(workout);
  const tonnage = workoutTonnage(workout);
  const vol = useMemo(() => workoutMuscleVolume(workout, exerciseById), [workout, exerciseById]);
  const colorFn = heatColorFor(vol);

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full p-4 text-left active:opacity-80"
        onClick={() => { haptic.selection(); setOpen(!open); }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold">
              {date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}
            </div>
            <div className="text-sm hint mt-0.5">
              {formatDuration(workout.startedAt, workout.endedAt!)} · {workout.exercises.length} упр. · {sets} подходов
            </div>
            <div className="text-sm hint mt-0.5">
              {formatKg(tonnage)} кг
              {workout.prs.length > 0 && (
                <span className="ml-2" title="Личные рекорды">🏆 {workout.prs.length}</span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <MuscleMiniMap getColor={colorFn} height={72} />
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5 slide-up">
          {workout.exercises.map((we) => {
            const def = exerciseById(we.exerciseId);
            return (
              <div key={we.exerciseId} className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--tg-hint) 8%, transparent)' }}>
                <div className="font-medium mb-1.5">{def?.name ?? 'Упражнение'}</div>
                <div className="space-y-0.5">
                  {we.sets.map((s, i) => (
                    <div
                      key={s.id}
                      className="text-sm flex items-center gap-2 rounded px-1.5 py-0.5"
                      style={s.pr ? { background: 'color-mix(in srgb, #22c55e 14%, transparent)' } : undefined}
                    >
                      <span className="hint w-5">{i + 1}</span>
                      <span className={s.pr ? 'font-semibold' : ''}>{s.weight} кг × {s.reps}</span>
                      {s.pr && <span className="pr-pop">🏆</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
