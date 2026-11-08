export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
