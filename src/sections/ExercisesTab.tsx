import { useMemo, useState } from 'react';
import type { ExerciseDef } from '@/types';
import { useStore } from '@/lib/storage';
import { analyzeExercise, formatKg } from '@/lib/analytics';
import { MiniChart } from '@/components/MiniChart';
import { MUSCLE_LABELS } from '@/data/exercises';
import { haptic, useBackButton } from '@/lib/telegram';
import type { TrendStatus, Confidence } from '@/types';

const STATUS_META: Record<TrendStatus, { label: string; color: string; bg: string }> = {
  growing: { label: 'Растёт', color: '#22c55e', bg: 'color-mix(in srgb, #22c55e 14%, transparent)' },
  plateau: { label: 'Плато', color: '#eab308', bg: 'color-mix(in srgb, #eab308 14%, transparent)' },
  falling: { label: 'Падает', color: '#ef4444', bg: 'color-mix(in srgb, #ef4444 14%, transparent)' },
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: 'низкая',
  medium: 'средняя',
  high: 'высокая',
};

export function ExercisesTab() {
  const { exercises, workouts } = useStore();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  // упражнения, которые хоть раз выполнялись, — сверху
  const list = useMemo(() => {
    const used = new Set<string>();
    for (const w of workouts) for (const e of w.exercises) used.add(e.exerciseId);
    const q = query.trim().toLowerCase();
    return exercises
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const ua = used.has(a.id) ? 0 : 1;
        const ub = used.has(b.id) ? 0 : 1;
        if (ua !== ub) return ua - ub;
        return a.name.localeCompare(b.name, 'ru');
      });
  }, [exercises, workouts, query]);

  const openExercise = openId ? exercises.find((e) => e.id === openId) : null;

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold mb-3">Упражнения</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск…"
        className="w-full rounded-xl px-4 py-2.5 mb-3 outline-none"
        style={{ background: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
      />
      <div className="space-y-2">
        {list.map((e) => (
          <ExerciseRow key={e.id} exercise={e} onOpen={() => { haptic.light(); setOpenId(e.id); }} />
        ))}
        {list.length === 0 && <div className="hint text-center py-8">Ничего не найдено</div>}
      </div>
      {openExercise && <ExerciseDetail exercise={openExercise} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function ExerciseRow({ exercise, onOpen }: { exercise: ExerciseDef; onOpen: () => void }) {
  const { workouts } = useStore();
  const a = useMemo(() => analyzeExercise(workouts, exercise.id), [workouts, exercise.id]);
  const meta = a.status ? STATUS_META[a.status] : null;

  return (
    <button className="card w-full text-left p-3.5 active:scale-[0.98] transition-transform" onClick={onOpen}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium min-w-0 truncate">{exercise.name}</div>
        {meta ? (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ color: meta.color, background: meta.bg }}
          >
            {meta.label}
          </span>
        ) : (
          <span className="text-xs hint whitespace-nowrap">нет данных</span>
        )}
      </div>
      <div className="text-sm hint mt-0.5">
        {exercise.primary.map((m) => MUSCLE_LABELS[m]).join(', ')}
        {a.sessions.length > 0 && ` · ${a.sessions.length} сессий`}
        {a.prs.maxWeight > 0 && ` · макс. ${formatKg(a.prs.maxWeight)} кг`}
      </div>
    </button>
  );
}

// ─── Карточка упражнения ──────────────────────────────────────────
function ExerciseDetail({ exercise, onClose }: { exercise: ExerciseDef; onClose: () => void }) {
  const { workouts } = useStore();
  const a = useMemo(() => analyzeExercise(workouts, exercise.id), [workouts, exercise.id]);
  const meta = a.status ? STATUS_META[a.status] : null;
  useBackButton(true, onClose);

  const e1rmData = a.sessions.map((s) => ({
    x: new Date(s.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' }),
    y: Math.round(s.bestE1rm * 10) / 10,
  }));
  const weightData = a.sessions.map((s) => ({
    x: new Date(s.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' }),
    y: s.topWeight,
  }));

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto" style={{ background: 'var(--tg-bg)' }}>
      <div className="px-4 pt-4 pb-8 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => { haptic.light(); onClose(); }} className="hint text-xl px-1" aria-label="Назад">‹</button>
          <h2 className="text-lg font-bold flex-1 leading-tight">{exercise.name}</h2>
          {meta && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: meta.color, background: meta.bg }}>
              {meta.label}
            </span>
          )}
        </div>

        {/* мышцы */}
        <div className="card p-4 mb-3">
          <div className="text-sm mb-1.5">
            <span className="hint">Основные: </span>
            {exercise.primary.map((m) => MUSCLE_LABELS[m]).join(', ')}
          </div>
          {exercise.secondary.length > 0 && (
            <div className="text-sm">
              <span className="hint">Вторичные: </span>
              {exercise.secondary.map((m) => MUSCLE_LABELS[m]).join(', ')}
            </div>
          )}
        </div>

        {a.sessions.length === 0 ? (
          <div className="card p-6 text-center hint">Это упражнение ещё не выполнялось</div>
        ) : (
          <>
            {/* график 1RM */}
            <div className="card p-4 mb-3">
              <div className="font-semibold mb-1">Расчётный 1RM (Эпли)</div>
              <MiniChart data={e1rmData} height={130} yLabel="кг" color="#22c55e" />
            </div>

            {/* рабочие веса */}
            <div className="card p-4 mb-3">
              <div className="font-semibold mb-1">Рабочий вес по сессиям</div>
              <MiniChart data={weightData} height={110} yLabel="кг" />
            </div>

            {/* лучший / последний подход */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="card p-3.5">
                <div className="text-xs hint mb-1">Лучший подход</div>
                {a.bestSet ? (
                  <div className="font-semibold">{a.bestSet.weight} кг × {a.bestSet.reps}</div>
                ) : (
                  <div className="hint">—</div>
                )}
              </div>
              <div className="card p-3.5">
                <div className="text-xs hint mb-1">Последний подход</div>
                {a.lastSet ? (
                  <div className="font-semibold">{a.lastSet.weight} кг × {a.lastSet.reps}</div>
                ) : (
                  <div className="hint">—</div>
                )}
              </div>
            </div>

            {/* рекомендация */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-semibold">Далее</div>
                <span className="text-xs hint">уверенность: {CONFIDENCE_LABEL[a.confidence]}</span>
              </div>
              <p className="text-sm leading-relaxed">{a.recommendation}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
