export function normalizeVietnamese(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}
export const slugify = (value: string) => normalizeVietnamese(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
export function httpUrl(value: string | null | undefined) {
  if (!value) return null;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String(error.message);
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}
export const platformLabels = { shopee: 'Shopee', tiktok: 'TikTok Shop', lazada: 'Lazada', other: 'Cửa hàng' };
