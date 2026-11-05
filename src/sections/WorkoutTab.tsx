import { useEffect, useMemo, useRef, useState } from 'react';
import type { ExerciseDef, SetEntry, Workout, WorkoutExercise, WorkoutPr } from '@/types';
import { useStore, uid } from '@/lib/storage';
import { detectPRs, formatDuration, formatKg, workoutSetCount, workoutTonnage } from '@/lib/analytics';
import { haptic, useMainButton } from '@/lib/telegram';
import { ExercisePicker } from '@/components/ExercisePicker';
import { RestTimer } from '@/components/RestTimer';

const PR_LABEL: Record<string, string> = {
  weight: 'Рекорд веса!',
  reps: 'Рекорд повторов!',
  e1rm: 'Рекорд 1RM!',
};

export function WorkoutTab() {
  const store = useStore();
  const { active } = store;
  const [summary, setSummary] = useState<Workout | null>(null);

  if (summary) return <WorkoutSummary workout={summary} onClose={() => setSummary(null)} />;
  if (!active) return <IdleView />;
  return <ActiveSession workout={active} onFinish={setSummary} />;
}

// ─── Главный экран без активной тренировки ────────────────────────
function IdleView() {
  const { workouts, setActive } = useStore();
  const last = workouts.length > 0 ? [...workouts].sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0] : null;

  const start = () => {
    haptic.medium();
    setActive({ id: uid(), startedAt: Date.now(), endedAt: null, exercises: [], prs: [] });
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
      <div className="text-6xl mb-4">🏋️</div>
      <h1 className="text-2xl font-bold mb-2">Готов к тренировке?</h1>
      <p className="hint mb-8">Записывай подходы, следи за прогрессом и бей рекорды.</p>
      <button className="btn-primary w-full max-w-xs text-lg" onClick={start}>
        Начать тренировку
      </button>
      {last && (
        <div className="card w-full max-w-xs mt-8 p-4 text-left">
          <div className="text-sm hint mb-1">Последняя тренировка</div>
          <div className="font-semibold">
            {new Date(last.endedAt!).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </div>
          <div className="text-sm hint mt-1">
            {last.exercises.length} упр. · {workoutSetCount(last)} подходов · {formatKg(workoutTonnage(last))} кг
            {last.prs.length > 0 && ` · 🏆 ${last.prs.length}`}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Активная сессия ──────────────────────────────────────────────
function ActiveSession({ workout, onFinish }: { workout: Workout; onFinish: (w: Workout) => void }) {
  const store = useStore();
  const { setActive, setWorkouts, workouts, exerciseById } = store;
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [restFor, setRestFor] = useState<string | null>(null); // exerciseId, для которого идёт отдых
  const [prFlash, setPrFlash] = useState<string[] | null>(null); // типы PR для анимации
  const [elapsed, setElapsed] = useState(0);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - workout.startedAt), 1000);
    return () => clearInterval(t);
  }, [workout.startedAt]);

  const update = (w: Workout) => setActive({ ...w });

  const historyForPr: Workout[] = useMemo(
    () => [...workouts, { ...workout, endedAt: Date.now() }],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workouts, workout.exercises],
  );

  const addExercise = (def: ExerciseDef) => {
    setPicking(false);
    if (workout.exercises.some((e) => e.exerciseId === def.id)) return;
    update({ ...workout, exercises: [...workout.exercises, { exerciseId: def.id, sets: [] }] });
  };

  const removeExercise = (exerciseId: string) => {
    haptic.warning();
    update({ ...workout, exercises: workout.exercises.filter((e) => e.exerciseId !== exerciseId) });
  };

  const addSet = (exerciseId: string, weight: number, reps: number) => {
    // PR считаем относительно истории БЕЗ текущего подхода
    const { types, prs } = detectPRs(historyForPr, exerciseId, weight, reps);
    const set: SetEntry = { id: uid(), weight, reps, pr: types.length > 0 ? types : undefined, doneAt: Date.now() };
    const next: Workout = {
      ...workout,
      exercises: workout.exercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, set] } : e,
      ),
      prs: [...workout.prs, ...prs],
    };
    update(next);
    if (types.length > 0) {
      haptic.success();
      setPrFlash(types);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
      flashTimeout.current = setTimeout(() => setPrFlash(null), 1800);
    } else {
      haptic.light();
    }
    setRestFor(exerciseId);
  };

  const removeSet = (exerciseId: string, setId: string) => {
    haptic.warning();
    update({
      ...workout,
      exercises: workout.exercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e,
      ),
    });
  };

  const finish = () => {
    const done: Workout = { ...workout, endedAt: Date.now() };
    setWorkouts([...workouts, done]);
    setActive(null);
    haptic.success();
    onFinish(done);
  };

  useMainButton(workout.exercises.length > 0 ? 'Завершить тренировку' : null, finish);

  const mm = Math.floor(elapsed / 60000);
  const ss = Math.floor((elapsed % 60000) / 1000);

  return (
    <div className="px-4 pt-4 pb-6">
      {/* шапка сессии */}
      <div className="card p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm hint">Тренировка идёт</div>
          <div className="text-2xl font-bold tabular-nums">
            {mm}:{String(ss).padStart(2, '0')}
          </div>
        </div>
        <div className="text-right text-sm hint">
          <div>{workoutSetCount(workout)} подходов</div>
          <div>{formatKg(workoutTonnage(workout))} кг</div>
          {workout.prs.length > 0 && <div>🏆 {workout.prs.length} PR</div>}
        </div>
      </div>

      {/* упражнения */}
      <div className="space-y-3">
        {workout.exercises.map((we) => (
          <ExerciseBlock
            key={we.exerciseId}
            we={we}
            name={exerciseById(we.exerciseId)?.name ?? 'Упражнение'}
            onAddSet={(w, r) => addSet(we.exerciseId, w, r)}
            onRemoveSet={(sid) => removeSet(we.exerciseId, sid)}
            onRemove={() => removeExercise(we.exerciseId)}
          />
        ))}
      </div>

      <button
        className="w-full card p-4 mt-3 text-center font-semibold active:scale-[0.98] transition-transform"
        style={{ color: 'var(--tg-link)' }}
        onClick={() => { haptic.selection(); setPicking(true); }}
      >
        + Добавить упражнение
      </button>

      {restFor && (
        <div className="mt-3">
          <RestTimer
            seconds={store.restSeconds}
            onDone={() => setRestFor(null)}
            onSkip={() => setRestFor(null)}
          />
        </div>
      )}

      {workout.exercises.length > 0 && !confirming && (
        <button
          className="btn-primary w-full mt-4"
          onClick={() => { haptic.medium(); setConfirming(true); }}
        >
          Завершить тренировку
        </button>
      )}

      {confirming && (
        <div className="card p-4 mt-4 slide-up">
          <div className="font-semibold text-center mb-3">Завершить тренировку?</div>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-2xl py-3 font-semibold active:opacity-80"
              style={{ background: 'color-mix(in srgb, var(--tg-hint) 14%, transparent)' }}
              onClick={() => { haptic.light(); setConfirming(false); }}
            >
              Отмена
            </button>
            <button className="btn-primary flex-1 !py-3" onClick={finish}>
              Завершить
            </button>
          </div>
        </div>
      )}

      {picking && <ExercisePicker onPick={addExercise} onClose={() => setPicking(false)} />}

      {/* вспышка PR */}
      {prFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <Confetti />
          <div className="pr-pop rounded-3xl px-8 py-6 text-center shadow-2xl" style={{ background: 'var(--tg-secondary-bg)' }}>
            <div className="text-5xl mb-2">🏆</div>
            {prFlash.map((t) => (
              <div key={t} className="text-lg font-bold" style={{ color: '#22c55e' }}>{PR_LABEL[t]}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Блок упражнения в сессии ─────────────────────────────────────
function ExerciseBlock({
  we,
  name,
  onAddSet,
  onRemoveSet,
  onRemove,
}: {
  we: WorkoutExercise;
  name: string;
  onAddSet: (weight: number, reps: number) => void;
  onRemoveSet: (setId: string) => void;
  onRemove: () => void;
}) {
  const last = we.sets[we.sets.length - 1];
  const [weight, setWeight] = useState<number>(last?.weight ?? 20);
  const [reps, setReps] = useState<number>(last?.reps ?? 10);

  // подсказываем значения последнего подхода при добавлении
  useEffect(() => {
    if (last) {
      setWeight(last.weight);
      setReps(last.reps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [we.sets.length]);

  const step = (v: number, d: number, min: number) => Math.max(min, Math.round((v + d) * 100) / 100);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{name}</div>
        <button className="hint text-xl px-1" onClick={onRemove} aria-label="Удалить упражнение">✕</button>
      </div>

      {we.sets.length > 0 && (
        <div className="mb-3 space-y-1">
          <div className="grid grid-cols-[2rem_1fr_1fr_2rem] text-xs hint px-1">
            <span>#</span><span>Вес, кг</span><span>Повторы</span><span />
          </div>
          {we.sets.map((s, i) => (
            <div
              key={s.id}
              className={`grid grid-cols-[2rem_1fr_1fr_2rem] items-center rounded-lg px-1 py-1.5 text-sm ${
                s.pr ? 'font-semibold' : ''
              }`}
              style={s.pr ? { background: 'color-mix(in srgb, #22c55e 12%, transparent)' } : undefined}
            >
              <span className="hint">{i + 1}</span>
              <span>{s.weight} кг</span>
              <span>
                {s.reps}
                {s.pr && <span className="ml-1.5 pr-pop inline-block" title="Личный рекорд">🏆</span>}
              </span>
              <button className="hint text-base" onClick={() => onRemoveSet(s.id)} aria-label="Удалить подход">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="text-xs hint mb-1">Вес, кг</div>
          <div className="flex items-center gap-1">
            <button className="chip !px-2.5" onClick={() => { haptic.selection(); setWeight((v) => step(v, -2.5, 0)); }}>−</button>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(Math.max(0, Number(e.target.value) || 0))}
              className="w-16 text-center rounded-lg py-1.5 outline-none font-semibold"
              style={{ background: 'color-mix(in srgb, var(--tg-hint) 10%, transparent)', color: 'var(--tg-text)' }}
            />
            <button className="chip !px-2.5" onClick={() => { haptic.selection(); setWeight((v) => step(v, 2.5, 0)); }}>+</button>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs hint mb-1">Повторы</div>
          <div className="flex items-center gap-1">
            <button className="chip !px-2.5" onClick={() => { haptic.selection(); setReps((v) => Math.max(1, v - 1)); }}>−</button>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(Math.max(1, Math.round(Number(e.target.value) || 1)))}
              className="w-14 text-center rounded-lg py-1.5 outline-none font-semibold"
              style={{ background: 'color-mix(in srgb, var(--tg-hint) 10%, transparent)', color: 'var(--tg-text)' }}
            />
            <button className="chip !px-2.5" onClick={() => { haptic.selection(); setReps((v) => v + 1); }}>+</button>
          </div>
        </div>
        <button
          className="btn-primary !py-2 !px-4 whitespace-nowrap"
          onClick={() => onAddSet(weight, reps)}
        >
          + Подход
        </button>
      </div>
    </div>
  );
}

// ─── Сводка тренировки ────────────────────────────────────────────
export function WorkoutSummary({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const { exerciseById } = useStore();
  const tonnage = workoutTonnage(workout);
  const sets = workoutSetCount(workout);

  return (
    <div className="px-4 pt-8 pb-6 slide-up">
      <div className="relative card p-6 text-center overflow-hidden">
        <Confetti />
        <div className="text-5xl mb-2">🎉</div>
        <h2 className="text-xl font-bold mb-4">Тренировка завершена!</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <div className="text-lg font-bold">{formatDuration(workout.startedAt, workout.endedAt!)}</div>
            <div className="text-xs hint">Длительность</div>
          </div>
          <div>
            <div className="text-lg font-bold">{sets}</div>
            <div className="text-xs hint">Подходов</div>
          </div>
          <div>
            <div className="text-lg font-bold">{formatKg(tonnage)}</div>
            <div className="text-xs hint">Тоннаж, кг</div>
          </div>
        </div>
        {workout.prs.length > 0 && (
          <div className="rounded-2xl p-3 text-left" style={{ background: 'color-mix(in srgb, #eab308 12%, transparent)' }}>
            <div className="font-semibold mb-1">🏆 Рекорды: {workout.prs.length}</div>
            {workout.prs.map((p: WorkoutPr, i: number) => (
              <PrLine key={i} pr={p} name={exerciseById(p.exerciseId)?.name ?? ''} />
            ))}
          </div>
        )}
      </div>
      <button className="btn-primary w-full mt-4" onClick={() => { haptic.light(); onClose(); }}>
        Готово
      </button>
    </div>
  );
}

export function PrLine({ pr, name }: { pr: WorkoutPr; name: string }) {
  let text = '';
  if (pr.type === 'weight') text = `${pr.value} кг × ${pr.reps}`;
  else if (pr.type === 'reps') text = `${pr.weight} кг × ${pr.value} повт.`;
  else text = `расч. 1RM ${pr.value} кг (${pr.weight}×${pr.reps})`;
  return (
    <div className="text-sm py-0.5">
      <span className="font-medium">{name}</span> — {text}
    </div>
  );
}

// ─── Конфетти ─────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a855f7'];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        left: `${(i * 41) % 100}%`,
        delay: `${(i % 8) * 0.09}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{ left: p.left, top: 0, background: p.color, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}
