export function formatTokens(value: number): string {
  if (value >= 1e15) {
    return (value / 1e15).toFixed(2) + 'Q'; // Quadrillion
  }
  if (value >= 1e12) {
    return (value / 1e12).toFixed(2) + 'T'; // Trillion
  }
  if (value >= 1e9) {
    return (value / 1e9).toFixed(2) + 'B'; // Billion
  }
  if (value >= 1e6) {
    return (value / 1e6).toFixed(2) + 'M'; // Million
  }
  if (value >= 1e3) {
    return (value / 1e3).toFixed(2) + 'K'; // Thousand
  }
  
  return value.toFixed(0);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
