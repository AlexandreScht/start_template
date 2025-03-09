export function truncateToDecimals(num: number | string, decimals: number) {
  const v = typeof num === 'number' ? num : parseFloat(num);
  const factor = Math.pow(10, decimals);
  return Math.trunc(v * factor) / factor;
}
