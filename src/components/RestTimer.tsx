import { useEffect, useRef, useState } from 'react';
import { haptic } from '@/lib/telegram';

interface RestTimerProps {
  seconds: number;          // стартовое значение
  onDone?: () => void;
  onSkip: () => void;
}

// Круговой таймер отдыха между подходами
export function RestTimer({ seconds, onDone, onSkip }: RestTimerProps) {
  const [left, setLeft] = useState(seconds);
  const totalRef = useRef(seconds);
  totalRef.current = Math.max(totalRef.current, left);

  useEffect(() => {
    if (left <= 0) {
      haptic.success();
      onDone?.();
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDone]);

  const total = totalRef.current || seconds;
  const frac = left / total;
  const R = 40;
  const C = 2 * Math.PI * R;
  const mm = Math.floor(left / 60);
  const ss = left % 60;

  return (
    <div className="card p-4 flex items-center gap-4 slide-up">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="color-mix(in srgb, var(--tg-hint) 20%, transparent)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={R} fill="none"
            stroke={frac > 0.25 ? 'var(--tg-button)' : '#ef4444'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold tabular-nums">
            {mm}:{String(ss).padStart(2, '0')}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold mb-2">Отдых</div>
        <div className="flex gap-2 flex-wrap">
          <button className="chip" onClick={() => { haptic.selection(); setLeft((v) => v + 15); }}>+15 сек</button>
          <button className="chip" onClick={() => { haptic.selection(); setLeft((v) => Math.max(0, v - 15)); }}>−15 сек</button>
          <button className="chip" onClick={() => { haptic.light(); onSkip(); }}>Пропустить</button>
        </div>
      </div>
    </div>
  );
}
