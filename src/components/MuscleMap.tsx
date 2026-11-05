import { useId } from 'react';
import type { MuscleGroup } from '@/types';

// ─── Карта тела на основе анатомического эскиза ───────────────────
// Подложка — рисунок mannequin-front/back.png, поверх — контуры мышц,
// залитые тепловым цветом в режиме multiply (цвет ложится прямо
// на мышцу, линии эскиза остаются видны).

interface Shape {
  muscle: MuscleGroup;
  d: string;
  mirror?: boolean; // отзеркалить на правую половину
}

const FRONT_W = 559;
const FRONT_H = 1307;
const BACK_W = 561;
const BACK_H = 1307;

// Контуры в координатах исходных обрезков; левая половина + зеркало
const FRONT_SHAPES: Shape[] = [
  // трапеции (вид спереди — верхние пучки вдоль шеи)
  { muscle: 'traps', d: 'M 242 176 L 208 194 L 162 214 L 182 226 L 222 212 L 246 198 Z', mirror: true },
  // дельты: средний (внешний) и передний пучки
  { muscle: 'delts_side', d: 'M 154 222 C 122 225 102 248 101 280 C 101 308 113 324 129 329 L 153 322 L 157 250 Z', mirror: true },
  { muscle: 'delts_front', d: 'M 159 224 C 176 220 196 222 208 232 C 212 258 211 292 204 318 L 161 326 C 157 292 156 256 159 224 Z', mirror: true },
  // грудь (большая грудная)
  { muscle: 'chest', d: 'M 276 234 L 216 226 C 200 232 193 256 196 286 C 202 310 238 322 276 318 Z', mirror: true },
  // бицепс
  { muscle: 'biceps', d: 'M 122 332 C 110 356 107 392 114 420 C 124 436 146 438 156 424 C 163 394 161 356 151 336 C 141 326 129 325 122 332 Z', mirror: true },
  // предплечья
  { muscle: 'forearms', d: 'M 100 444 C 82 474 70 520 70 560 C 73 590 87 606 104 604 C 121 590 130 542 127 496 C 124 464 113 444 100 444 Z', mirror: true },
  // пресс (прямая мышца живота)
  { muscle: 'abs', d: 'M 216 336 L 344 330 C 344 390 342 440 338 478 C 332 518 308 542 280 546 C 252 542 226 518 220 478 C 216 440 214 390 216 336 Z' },
  // квадрицепс (вся передняя поверхность бедра)
  { muscle: 'quads', d: 'M 172 572 C 159 642 161 722 176 800 C 183 836 196 858 212 864 L 246 858 C 259 818 263 720 260 642 C 256 600 250 576 240 562 L 196 558 C 185 560 176 564 172 572 Z', mirror: true },
  // голень спереди (передняя большеберцовая)
  { muscle: 'calves', d: 'M 186 910 C 172 945 170 1000 179 1045 C 186 1088 195 1110 208 1116 L 236 1110 C 246 1070 248 1000 242 950 C 236 918 227 902 214 898 C 200 896 191 900 186 910 Z', mirror: true },
];

const BACK_SHAPES: Shape[] = [
  // трапеции: верхний веер + центральный ромб
  { muscle: 'traps', d: 'M 280 162 L 240 168 L 140 208 L 170 228 L 234 216 L 280 202 Z', mirror: true },
  { muscle: 'traps', d: 'M 280 202 L 246 214 L 198 238 C 214 278 244 318 262 344 L 280 388 Z', mirror: true },
  // задние дельты
  { muscle: 'delts_rear', d: 'M 132 226 C 116 236 109 260 113 286 L 150 300 L 204 286 C 210 256 206 230 196 218 C 174 210 150 213 132 226 Z', mirror: true },
  // трицепс
  { muscle: 'triceps', d: 'M 119 316 C 109 346 106 396 113 436 C 121 458 141 462 151 450 C 159 420 161 362 153 326 C 141 312 127 310 119 316 Z', mirror: true },
  // широчайшие
  { muscle: 'lats', d: 'M 170 306 C 159 346 161 402 176 446 C 189 479 211 493 233 496 L 253 480 C 246 430 236 370 219 326 C 206 306 186 299 170 306 Z', mirror: true },
  // поясница (разгибатели)
  { muscle: 'lower_back', d: 'M 248 494 L 314 494 L 309 554 C 294 566 268 566 254 554 Z' },
  // ягодицы
  { muscle: 'glutes', d: 'M 172 562 C 161 592 163 622 176 642 C 196 657 240 662 268 652 L 278 642 C 281 612 281 582 276 560 C 240 551 196 553 172 562 Z', mirror: true },
  // бицепс бедра
  { muscle: 'hamstrings', d: 'M 180 652 C 169 702 171 772 186 830 C 196 858 211 870 226 872 L 258 864 C 268 810 268 730 260 680 C 250 656 230 646 206 646 Z', mirror: true },
  // икры
  { muscle: 'calves', d: 'M 184 892 C 166 922 163 972 176 1016 C 186 1056 196 1090 206 1116 L 236 1120 C 251 1080 259 1010 253 950 C 246 910 231 888 211 882 C 199 880 189 884 184 892 Z', mirror: true },
  // предплечья
  { muscle: 'forearms', d: 'M 100 444 C 82 474 70 522 71 566 C 75 596 90 609 106 606 C 123 591 131 542 127 496 C 123 462 112 442 100 444 Z', mirror: true },
];

interface MuscleMapProps {
  side: 'front' | 'back';
  // цвет мышцы или null, если нагрузки не было (контур не заливаем)
  getColor: (m: MuscleGroup) => string | null;
  height?: number;
}

export function MuscleFigure({ side, getColor, height = 300 }: MuscleMapProps) {
  const isFront = side === 'front';
  const W = isFront ? FRONT_W : BACK_W;
  const H = isFront ? FRONT_H : BACK_H;
  const shapes = isFront ? FRONT_SHAPES : BACK_SHAPES;
  const src = `${import.meta.env.BASE_URL}mannequin-${side}.png`;
  const filterId = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div className="relative inline-block" style={{ height }}>
      <img
        src={src}
        alt={isFront ? 'Тело спереди' : 'Тело сзади'}
        className="h-full w-auto block select-none"
        draggable={false}
      />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <g style={{ mixBlendMode: 'multiply' }}>
          {shapes.map((s, i) => {
            const color = getColor(s.muscle);
            if (!color) return null;
            const common = {
              d: s.d,
              fill: color,
              opacity: 0.9,
              filter: `url(#${filterId})`,
              style: { transition: 'fill 0.4s' } as const,
            };
            return (
              <g key={i}>
                <path {...common} />
                {s.mirror && <path {...common} transform={`translate(${W} 0) scale(-1 1)`} />}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// Мини-карта: обе стороны рядом (для карточек истории)
export function MuscleMiniMap({ getColor, height = 96 }: { getColor: (m: MuscleGroup) => string | null; height?: number }) {
  return (
    <div className="flex gap-1 items-start bg-white rounded-xl p-1">
      <MuscleFigure side="front" getColor={getColor} height={height} />
      <MuscleFigure side="back" getColor={getColor} height={height} />
    </div>
  );
}
