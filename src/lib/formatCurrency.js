export function formatCurrency(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + n.toLocaleString();
  return '$' + n;
}

export function formatRange(low, high) {
  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
}

export function formatShortRange(low, high) {
  const fmtShort = (n) => {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + n;
  };
  return `${fmtShort(low)} - ${fmtShort(high)}`;
}
