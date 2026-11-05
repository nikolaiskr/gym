import { useMemo, useState } from 'react';
import type { ExerciseDef, MuscleGroup } from '@/types';
import { MUSCLE_FILTER_GROUPS, MUSCLE_LABELS } from '@/data/exercises';
import { useStore, uid } from '@/lib/storage';
import { haptic } from '@/lib/telegram';

interface ExercisePickerProps {
  onPick: (e: ExerciseDef) => void;
  onClose: () => void;
}

// Справочник: поиск, фильтр по группе мышц, создание своего упражнения
export function ExercisePicker({ onPick, onClose }: ExercisePickerProps) {
  const { exercises, addCustomExercise } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrimary, setNewPrimary] = useState<MuscleGroup[]>([]);
  const [newSecondary, setNewSecondary] = useState<MuscleGroup[]>([]);

  const list = useMemo(() => {
    let l = exercises;
    if (filter) {
      const g = MUSCLE_FILTER_GROUPS.find((x) => x.id === filter);
      if (g) l = l.filter((e) => e.primary.some((m) => g.muscles.includes(m)));
    }
    const q = query.trim().toLowerCase();
    if (q) l = l.filter((e) => e.name.toLowerCase().includes(q));
    return l;
  }, [exercises, filter, query]);

  const allMuscles = Object.keys(MUSCLE_LABELS) as MuscleGroup[];

  const toggleMuscle = (m: MuscleGroup, arr: MuscleGroup[], set: (v: MuscleGroup[]) => void) => {
    haptic.selection();
    set(arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m]);
  };

  const createExercise = () => {
    const name = newName.trim();
    if (!name || newPrimary.length === 0) return;
    const def: ExerciseDef = {
      id: `custom-${uid()}`,
      name,
      primary: newPrimary,
      secondary: newSecondary,
      pattern: newPrimary.some((m) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(m)) ? 'legs' : 'push',
      half: newPrimary.some((m) => ['quads', 'hamstrings', 'glutes', 'calves', 'abs', 'lower_back'].includes(m)) ? 'lower' : 'upper',
      custom: true,
    };
    addCustomExercise(def);
    haptic.success();
    onPick(def);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: 'var(--tg-bg)' }}>
      <div className="p-4 pb-2 flex items-center gap-3">
        <button onClick={onClose} className="hint text-2xl leading-none px-1" aria-label="Закрыть">✕</button>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск упражнения…"
          className="flex-1 rounded-xl px-4 py-2.5 text-base outline-none"
          style={{ background: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
        />
      </div>

      <div className="px-4 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {MUSCLE_FILTER_GROUPS.map((g) => (
          <button
            key={g.id}
            className={`chip whitespace-nowrap ${filter === g.id ? 'chip-active' : ''}`}
            onClick={() => { haptic.selection(); setFilter(filter === g.id ? null : g.id); }}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {list.map((e) => (
          <button
            key={e.id}
            className="card w-full text-left p-3.5 active:scale-[0.98] transition-transform"
            onClick={() => { haptic.light(); onPick(e); }}
          >
            <div className="font-medium">{e.name}</div>
            <div className="text-sm hint mt-0.5">
              {e.primary.map((m) => MUSCLE_LABELS[m]).join(', ')}
              {e.secondary.length > 0 && ` · ${e.secondary.map((m) => MUSCLE_LABELS[m]).join(', ')}`}
            </div>
          </button>
        ))}
        {list.length === 0 && <div className="hint text-center py-8">Ничего не найдено</div>}

        <button
          className="w-full text-center py-3 font-medium"
          style={{ color: 'var(--tg-link)' }}
          onClick={() => { haptic.selection(); setCreating(!creating); }}
        >
          {creating ? 'Скрыть форму' : '+ Создать своё упражнение'}
        </button>

        {creating && (
          <div className="card p-4 space-y-3 slide-up">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название упражнения"
              className="w-full rounded-xl px-4 py-2.5 outline-none"
              style={{ background: 'color-mix(in srgb, var(--tg-hint) 10%, transparent)', color: 'var(--tg-text)' }}
            />
            <div>
              <div className="text-sm font-medium mb-1.5">Основные мышцы</div>
              <div className="flex flex-wrap gap-1.5">
                {allMuscles.map((m) => (
                  <button
                    key={m}
                    className={`chip !px-2.5 !py-1 !text-xs ${newPrimary.includes(m) ? 'chip-active' : ''}`}
                    onClick={() => toggleMuscle(m, newPrimary, setNewPrimary)}
                  >
                    {MUSCLE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1.5">Вторичные мышцы</div>
              <div className="flex flex-wrap gap-1.5">
                {allMuscles.map((m) => (
                  <button
                    key={m}
                    className={`chip !px-2.5 !py-1 !text-xs ${newSecondary.includes(m) ? 'chip-active' : ''}`}
                    onClick={() => toggleMuscle(m, newSecondary, setNewSecondary)}
                  >
                    {MUSCLE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn-primary w-full disabled:opacity-40"
              disabled={!newName.trim() || newPrimary.length === 0}
              onClick={createExercise}
            >
              Создать и добавить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
