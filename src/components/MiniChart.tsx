import { useMemo } from 'react';

interface MiniChartProps {
  data: { x: string; y: number }[];
  color?: string;
  height?: number;
  yLabel?: string;
}

// Лёгкий SVG-лайнчарт без зависимостей
export function MiniChart({ data, color = 'var(--tg-button)', height = 120, yLabel }: MiniChartProps) {
  const W = 320;
  const H = height;
  const padL = 34;
  const padR = 10;
  const padT = 10;
  const padB = 22;

  const { points, minY, maxY } = useMemo(() => {
    if (data.length === 0) return { points: [] as { px: number; py: number }[], minY: 0, maxY: 1 };
    const ys = data.map((d) => d.y);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    if (minY === maxY) {
      minY = minY * 0.9;
      maxY = maxY * 1.1 + 1;
    }
    const span = maxY - minY;
    minY -= span * 0.08;
    maxY += span * 0.08;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const points = data.map((d, i) => ({
      px: padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
      py: padT + innerH - ((d.y - minY) / (maxY - minY)) * innerH,
    }));
    return { points, minY, maxY };
  }, [data, H]);

  if (data.length === 0) {
    return (
      <div className="hint text-sm text-center py-6">Пока нет данных</div>
    );
  }

  const line = points.map((p) => `${p.px},${p.py}`).join(' ');
  const area = `${padL},${H - padB} ${line} ${points[points.length - 1].px},${H - padB}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="mc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* сетка */}
      {[0, 0.5, 1].map((k) => {
        const y = padT + (H - padT - padB) * k;
        const val = maxY - (maxY - minY) * k;
        return (
          <g key={k}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--tg-hint)" strokeOpacity="0.2" strokeDasharray="3 4" />
            <text x={padL - 5} y={y + 3.5} textAnchor="end" fontSize="9" fill="var(--tg-hint)">
              {Math.round(val)}
            </text>
          </g>
        );
      })}
      {yLabel && (
        <text x={padL - 5} y={padT - 3} textAnchor="end" fontSize="8" fill="var(--tg-hint)">
          {yLabel}
        </text>
      )}
      <polygon points={area} fill="url(#mc-fill)" />
      {points.length > 1 && <polyline points={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <circle key={i} cx={p.px} cy={p.py} r={points.length === 1 ? 4 : 3} fill={color} stroke="var(--tg-secondary-bg)" strokeWidth="1.5" />
      ))}
      {/* подписи X: первая, средняя, последняя */}
      {data.map((d, i) => {
        if (data.length > 3 && i !== 0 && i !== data.length - 1 && i !== Math.floor((data.length - 1) / 2)) return null;
        return (
          <text key={i} x={points[i].px} y={H - 6} textAnchor="middle" fontSize="8.5" fill="var(--tg-hint)">
            {d.x}
          </text>
        );
      })}
    </svg>
  );
}
