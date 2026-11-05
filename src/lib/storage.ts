import { useCallback, useEffect, useState } from 'react';
import type { ExerciseDef, Workout } from '@/types';
import { BASE_EXERCISES } from '@/data/exercises';

// ─── Слой хранения ────────────────────────────────────────────────
// MVP: localStorage. Интерфейс вынесен так, чтобы позже заменить
// реализацию на бэкенд с синхронизацией по Telegram ID, не меняя UI.

const KEY = 'liftshift:v1';

interface PersistedState {
  workouts: Workout[];           // завершённые
  active: Workout | null;        // активная сессия
  customExercises: ExerciseDef[]; // пользовательские упражнения
  restSeconds: number;
}

const EMPTY: PersistedState = { workouts: [], active: null, customExercises: [], restSeconds: 90 };

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function save(state: PersistedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — молча пропускаем в MVP */
  }
}

// ─── React-стор ───────────────────────────────────────────────────
export interface Store extends PersistedState {
  exercises: ExerciseDef[]; // база + пользовательские
  setWorkouts: (ws: Workout[]) => void;
  setActive: (w: Workout | null) => void;
  addCustomExercise: (e: ExerciseDef) => void;
  setRestSeconds: (s: number) => void;
  exerciseById: (id: string) => ExerciseDef | undefined;
}

let listeners: Array<() => void> = [];
let cache: PersistedState = load();

function emit() {
  save(cache);
  listeners.forEach((l) => l());
}

export function useStore(): Store {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const setWorkouts = useCallback((ws: Workout[]) => {
    cache = { ...cache, workouts: ws };
    emit();
  }, []);
  const setActive = useCallback((w: Workout | null) => {
    cache = { ...cache, active: w };
    emit();
  }, []);
  const addCustomExercise = useCallback((e: ExerciseDef) => {
    cache = { ...cache, customExercises: [...cache.customExercises, e] };
    emit();
  }, []);
  const setRestSeconds = useCallback((s: number) => {
    cache = { ...cache, restSeconds: s };
    emit();
  }, []);

  const exercises = [...BASE_EXERCISES, ...cache.customExercises];
  const exerciseById = useCallback(
    (id: string) => exercises.find((e) => e.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cache.customExercises],
  );

  return { ...cache, exercises, setWorkouts, setActive, addCustomExercise, setRestSeconds, exerciseById };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
