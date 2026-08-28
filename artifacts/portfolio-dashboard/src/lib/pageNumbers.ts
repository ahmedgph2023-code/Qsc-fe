/** Page buttons: first, last, and a window around the current page. */
export function visiblePageNumbers(current: number, total: number): Array<number | "gap"> {
  if (total <= 0) return [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const selected = new Set<number>([1, total]);
  for (let n = current - 1; n <= current + 1; n += 1) {
    if (n >= 1 && n <= total) selected.add(n);
  }

  const sorted = [...selected].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("gap");
    out.push(sorted[i]);
  }
  return out;
}
