import { useMemo, useState } from 'react';
import type { MuscleGroup } from '@/types';
import { useStore } from '@/lib/storage';
import { weekKey } from '@/lib/analytics';
import { muscleVolume, heatColorFor } from '@/lib/volume';
import { MuscleFigure } from '@/components/MuscleMap';
import { MiniChart } from '@/components/MiniChart';
import { MUSCLE_LABELS } from '@/data/exercises';
import { haptic } from '@/lib/telegram';

const WEEK_MS = 7 * 86400000;

export function MusclesTab() {
  const { workouts, exerciseById } = useStore();
  const [side, setSide] = useState<'front' | 'back'>('front');

  const weekAgo = Date.now() - WEEK_MS;

  const weekVolume = useMemo(
    () => muscleVolume(workouts, weekAgo, exerciseById),
    [workouts, exerciseById, weekAgo],
  );

  const totalSets = useMemo(() => {
    let n = 0;
    for (const w of workouts) {
      if (!w.endedAt || w.endedAt < weekAgo) continue;
      for (const we of w.exercises) n += we.sets.length;
    }
    return n;
  }, [workouts, weekAgo]);

  // динамика объёма по неделям (последние 8)
  const weeklySeries = useMemo(() => {
    const keys: string[] = [];
    const now = Date.now();
    for (let i = 7; i >= 0; i--) keys.push(weekKey(now - i * WEEK_MS));
    const counts: Record<string, number> = {};
    for (const w of workouts) {
      if (!w.endedAt) continue;
      const k = weekKey(w.endedAt);
      counts[k] = (counts[k] ?? 0) + w.exercises.reduce((a, e) => a + e.sets.length, 0);
    }
    return keys.map((k) => ({ x: k.slice(5) /* W45 */, y: counts[k] ?? 0 }));
  }, [workouts]);

  // топ-3 упражнения недели
  const top3 = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of workouts) {
      if (!w.endedAt || w.endedAt < weekAgo) continue;
      for (const we of w.exercises) counts[we.exerciseId] = (counts[we.exerciseId] ?? 0) + we.sets.length;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, n]) => ({ name: exerciseById(id)?.name ?? '—', sets: n }));
  }, [workouts, exerciseById, weekAgo]);

  const colorFn = heatColorFor(weekVolume);

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <h1 className="text-xl font-bold">Мышцы</h1>

      {/* карта тела */}
      <div className="card p-4">
        <div className="flex justify-center gap-2 mb-2">
          <button
            className={`chip ${side === 'front' ? 'chip-active' : ''}`}
            onClick={() => { haptic.selection(); setSide('front'); }}
          >
            Спереди
          </button>
          <button
            className={`chip ${side === 'back' ? 'chip-active' : ''}`}
            onClick={() => { haptic.selection(); setSide('back'); }}
          >
            Сзади
          </button>
        </div>
        <div className="flex justify-center">
          <div className="bg-white rounded-2xl px-4 py-2">
            <MuscleFigure side={side} getColor={colorFn} height={340} />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-1 text-xs hint">
          <span>Мало</span>
          <div className="w-28 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #3b82f6, #eab308, #ef4444)' }} />
          <span>Много</span>
        </div>
        {Object.entries(weekVolume).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            {Object.entries(weekVolume)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([m, v]) => (
                <span key={m} className="chip !text-xs !py-1">
                  {MUSCLE_LABELS[m as MuscleGroup]} · {Math.round(v)}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* счётчик недели */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="text-sm hint">Всего подходов за неделю</div>
          <div className="text-3xl font-bold">{totalSets}</div>
        </div>
        <div className="text-4xl">📊</div>
      </div>

      {/* динамика 8 недель */}
      <div className="card p-4">
        <div className="font-semibold mb-2">Объём по неделям</div>
        <MiniChart data={weeklySeries} height={110} />
      </div>

      {/* топ-3 */}
      <div className="card p-4">
        <div className="font-semibold mb-2">Топ-3 упражнения недели</div>
        {top3.length === 0 && <div className="hint text-sm">На этой неделе тренировок не было</div>}
        {top3.map((t, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <span>
              <span className="hint mr-2">{i + 1}.</span>
              {t.name}
            </span>
            <span className="font-semibold">{t.sets} подх.</span>
          </div>
        ))}
      </div>
    </div>
  );
}
