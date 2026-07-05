/** Split total reps/seconds across sets as evenly as possible. */
export function distributeAcrossSets(total: number, setCount: number): number[] {
  if (setCount < 1) return [total]
  const base = Math.floor(total / setCount)
  const remainder = total % setCount
  return Array.from({ length: setCount }, (_, i) => base + (i < remainder ? 1 : 0))
}
