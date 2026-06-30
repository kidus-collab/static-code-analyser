export function maintainabilityIndex(
  sloc: number,
  cyclomaticComplexity: number,
  halsteadVolume: number,
  commentPercent: number
): number {
  if (sloc <= 0) return 100;

  const raw =
    171 -
    5.2 * Math.log(halsteadVolume) -
    0.23 * cyclomaticComplexity -
    16.2 * Math.log(sloc) +
    50 * Math.sin(Math.sqrt(2.4 * commentPercent));

  return clamp((raw * 100) / 171, 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
