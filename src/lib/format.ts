export function money(value: number | string | { toString(): string }) {
  const amount = typeof value === 'number' ? value : Number(value.toString());
  const currency = process.env.NEXT_PUBLIC_CURRENCY || 'USD';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}
