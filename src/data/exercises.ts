import type { ExerciseDef, MuscleGroup } from '@/types';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Грудь',
  lats: 'Широчайшие',
  traps: 'Трапеции',
  delts_front: 'Передние дельты',
  delts_side: 'Средние дельты',
  delts_rear: 'Задние дельты',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  forearms: 'Предплечья',
  abs: 'Пресс',
  glutes: 'Ягодицы',
  quads: 'Квадрицепс',
  hamstrings: 'Бицепс бедра',
  calves: 'Икры',
  lower_back: 'Поясница',
};

// Группы для фильтра «по мышцам» в справочнике
export const MUSCLE_FILTER_GROUPS: { id: string; label: string; muscles: MuscleGroup[] }[] = [
  { id: 'chest', label: 'Грудь', muscles: ['chest'] },
  { id: 'back', label: 'Спина', muscles: ['lats', 'traps', 'lower_back'] },
  { id: 'delts', label: 'Плечи', muscles: ['delts_front', 'delts_side', 'delts_rear'] },
  { id: 'arms', label: 'Руки', muscles: ['biceps', 'triceps', 'forearms'] },
  { id: 'legs', label: 'Ноги', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { id: 'core', label: 'Пресс', muscles: ['abs'] },
];

const E = (
  id: string,
  name: string,
  primary: MuscleGroup[],
  secondary: MuscleGroup[],
  pattern: ExerciseDef['pattern'],
  half: ExerciseDef['half'],
): ExerciseDef => ({ id, name, primary, secondary, pattern, half });

export const BASE_EXERCISES: ExerciseDef[] = [
  // ── Жим: грудь ──
  E('bench-press', 'Жим штанги лёжа', ['chest'], ['triceps', 'delts_front'], 'push', 'upper'),
  E('bench-press-incline', 'Жим штанги на наклонной', ['chest'], ['triceps', 'delts_front'], 'push', 'upper'),
  E('db-press', 'Жим гантелей лёжа', ['chest'], ['triceps', 'delts_front'], 'push', 'upper'),
  E('db-press-incline', 'Жим гантелей на наклонной', ['chest', 'delts_front'], ['triceps'], 'push', 'upper'),
  E('dips', 'Отжимания на брусьях', ['chest', 'triceps'], ['delts_front'], 'push', 'upper'),
  E('pushups', 'Отжимания от пола', ['chest'], ['triceps', 'delts_front'], 'push', 'upper'),
  E('db-fly', 'Разводка гантелей лёжа', ['chest'], [], 'push', 'upper'),
  E('crossover', 'Сведения в кроссовере', ['chest'], [], 'push', 'upper'),

  // ── Жим: плечи ──
  E('ohp', 'Жим штанги стоя', ['delts_front', 'delts_side'], ['triceps', 'traps'], 'push', 'upper'),
  E('db-shoulder-press', 'Жим гантелей сидя', ['delts_front', 'delts_side'], ['triceps'], 'push', 'upper'),
  E('arnold-press', 'Жим Арнольда', ['delts_front', 'delts_side'], ['triceps'], 'push', 'upper'),
  E('lateral-raise', 'Махи гантелями в стороны', ['delts_side'], [], 'push', 'upper'),
  E('front-raise', 'Подъёмы гантелей перед собой', ['delts_front'], [], 'push', 'upper'),
  E('rear-delt-fly', 'Разводка в наклоне (задние дельты)', ['delts_rear'], ['traps'], 'pull', 'upper'),

  // ── Тяга: спина ──
  E('deadlift', 'Становая тяга', ['lower_back', 'glutes', 'hamstrings'], ['lats', 'traps', 'quads', 'forearms'], 'pull', 'lower'),
  E('deadlift-sumo', 'Становая тяга сумо', ['glutes', 'quads'], ['lower_back', 'hamstrings', 'traps'], 'pull', 'lower'),
  E('romanian-deadlift', 'Румынская тяга', ['hamstrings', 'glutes'], ['lower_back', 'forearms'], 'pull', 'lower'),
  E('pullups', 'Подтягивания', ['lats'], ['biceps', 'forearms'], 'pull', 'upper'),
  E('chinups', 'Подтягивания обратным хватом', ['lats', 'biceps'], ['forearms'], 'pull', 'upper'),
  E('lat-pulldown', 'Тяга верхнего блока', ['lats'], ['biceps'], 'pull', 'upper'),
  E('barbell-row', 'Тяга штанги в наклоне', ['lats', 'traps'], ['biceps', 'lower_back'], 'pull', 'upper'),
  E('db-row', 'Тяга гантели в наклоне', ['lats'], ['biceps', 'delts_rear'], 'pull', 'upper'),
  E('seated-row', 'Тяга горизонтального блока', ['lats', 'traps'], ['biceps'], 'pull', 'upper'),
  E('t-bar-row', 'Тяга Т-грифа', ['lats', 'traps'], ['biceps'], 'pull', 'upper'),
  E('shrugs', 'Шраги со штангой', ['traps'], ['forearms'], 'pull', 'upper'),
  E('face-pull', 'Тяга к лицу (face pull)', ['delts_rear', 'traps'], [], 'pull', 'upper'),

  // ── Руки ──
  E('barbell-curl', 'Подъём штанги на бицепс', ['biceps'], ['forearms'], 'pull', 'upper'),
  E('db-curl', 'Подъём гантелей на бицепс', ['biceps'], ['forearms'], 'pull', 'upper'),
  E('hammer-curl', 'Молотковые сгибания', ['biceps', 'forearms'], [], 'pull', 'upper'),
  E('preacher-curl', 'Сгибания на скамье Скотта', ['biceps'], [], 'pull', 'upper'),
  E('french-press', 'Французский жим лёжа', ['triceps'], [], 'push', 'upper'),
  E('triceps-pushdown', 'Разгибания на блоке', ['triceps'], [], 'push', 'upper'),
  E('close-grip-bench', 'Жим лёжа узким хватом', ['triceps'], ['chest', 'delts_front'], 'push', 'upper'),
  E('overhead-extension', 'Разгибания из-за головы', ['triceps'], [], 'push', 'upper'),

  // ── Ноги ──
  E('squat', 'Приседания со штангой', ['quads', 'glutes'], ['hamstrings', 'lower_back'], 'legs', 'lower'),
  E('front-squat', 'Фронтальные приседания', ['quads'], ['glutes', 'abs'], 'legs', 'lower'),
  E('leg-press', 'Жим ногами', ['quads', 'glutes'], ['hamstrings'], 'legs', 'lower'),
  E('lunges', 'Выпады с гантелями', ['quads', 'glutes'], ['hamstrings'], 'legs', 'lower'),
  E('bulgarian-split', 'Болгарские сплит-приседы', ['quads', 'glutes'], ['hamstrings'], 'legs', 'lower'),
  E('leg-curl', 'Сгибания ног лёжа', ['hamstrings'], [], 'legs', 'lower'),
  E('leg-extension', 'Разгибания ног сидя', ['quads'], [], 'legs', 'lower'),
  E('hip-thrust', 'Ягодичный мост со штангой', ['glutes'], ['hamstrings'], 'legs', 'lower'),
  E('calf-raise', 'Подъёмы на носки стоя', ['calves'], [], 'legs', 'lower'),

  // ── Пресс ──
  E('crunch', 'Скручивания', ['abs'], [], 'legs', 'lower'),
  E('leg-raise', 'Подъёмы ног в висе', ['abs'], ['forearms'], 'legs', 'lower'),
  E('plank-weighted', 'Планка с весом', ['abs'], ['lower_back'], 'legs', 'lower'),
];

export const DEFAULT_REST_SECONDS = 90;
