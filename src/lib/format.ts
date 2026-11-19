export function money(value: number | string | { toString(): string }) {
  const amount = typeof value === 'number' ? value : Number(value.toString());
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount);
}
