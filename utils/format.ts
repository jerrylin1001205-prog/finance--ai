export function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric' });
}

export function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
}
