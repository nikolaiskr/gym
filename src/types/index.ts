// ─── Мышечные группы ───────────────────────────────────────────────
export type MuscleGroup =
  | 'chest'        // Грудь
  | 'lats'         // Широчайшие
  | 'traps'        // Трапеции
  | 'delts_front'  // Передние дельты
  | 'delts_side'   // Средние дельты
  | 'delts_rear'   // Задние дельты
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'          // Пресс
  | 'glutes'       // Ягодицы
  | 'quads'        // Квадрицепсы
  | 'hamstrings'   // Бицепс бедра
  | 'calves'       // Икры
  | 'lower_back';  // Разгибатели спины

export type MovementPattern = 'push' | 'pull' | 'legs'; // жим / тяга / ноги
export type BodyHalf = 'upper' | 'lower';               // верх / низ

export interface ExerciseDef {
  id: string;
  name: string;             // русское название
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  pattern: MovementPattern;
  half: BodyHalf;
  custom?: boolean;
}

// ─── Тренировки ────────────────────────────────────────────────────
export type PrType = 'weight' | 'reps' | 'e1rm';

export interface SetEntry {
  id: string;
  weight: number; // кг
  reps: number;
  pr?: PrType[];  // пометки рекордов, ставятся при добавлении
  doneAt: number; // timestamp
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  startedAt: number;
  endedAt: number | null;
  exercises: WorkoutExercise[];
  prs: WorkoutPr[]; // зафиксированные PR на момент завершения
}

export interface WorkoutPr {
  exerciseId: string;
  type: PrType;
  value: number;      // вес / повторы / e1RM
  weight?: number;    // для reps/e1rm — при каком весе
  reps?: number;      // для weight/e1rm — сколько повторов
}

// Активная (незавершённая) сессия — Workout с endedAt === null

// ─── Аналитика ─────────────────────────────────────────────────────
export type TrendStatus = 'growing' | 'plateau' | 'falling'; // растёт / плато / падает
export type Confidence = 'low' | 'medium' | 'high';

export interface SessionBest {
  date: number;     // endedAt сессии
  bestE1rm: number; // лучший расчётный 1RM за сессию
  topWeight: number;
  topReps: number;
}

export interface ExerciseAnalytics {
  status: TrendStatus | null; // null — данных мало (<2 сессий)
  confidence: Confidence;
  sessions: SessionBest[];    // по возрастанию даты
  bestSet: SetEntry | null;   // лучший подход за всё время (по e1RM)
  lastSet: SetEntry | null;   // последний подход
  recommendation: string;
  prs: { maxWeight: number; maxWeightReps: number; maxE1rm: number };
}
