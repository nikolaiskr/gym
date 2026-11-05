// Тепловая шкала: синий (мало нагрузки) → красный (много)
export function heatColor(t: number): string {
  // t ∈ [0,1]: #3b82f6 → #eab308 → #ef4444
  const stops: [number, [number, number, number]][] = [
    [0, [59, 130, 246]],
    [0.5, [234, 179, 8]],
    [1, [239, 68, 68]],
  ];
  const clamped = Math.max(0, Math.min(1, t));
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b[0] - a[0] || 1;
  const k = (clamped - a[0]) / span;
  const mix = (x: number, y: number) => Math.round(x + (y - x) * k);
  return `rgb(${mix(a[1][0], b[1][0])}, ${mix(a[1][1], b[1][1])}, ${mix(a[1][2], b[1][2])})`;
}
