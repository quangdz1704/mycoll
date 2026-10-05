import { requireSupabase } from './supabase';

export async function compressImage(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chọn ảnh JPG, PNG hoặc WebP.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Ảnh tối đa 15 MB trước khi nén.');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('Không thể đọc ảnh. Hãy chọn một ảnh khác.'); });
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt chưa hỗ trợ xử lý ảnh.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Không thể nén ảnh.')), 'image/webp', 0.82));
    if (blob.size > 2 * 1024 * 1024) throw new Error('Ảnh sau nén vẫn quá 2 MB. Hãy chọn ảnh nhỏ hơn.');
    return blob;
  } finally { bitmap.close(); }
}
export async function uploadImage(file: File, storeId: string, bucket: 'product-images' | 'store-assets') {
  const client = requireSupabase();
  const blob = await compressImage(file);
  const path = `${storeId}/${crypto.randomUUID()}.webp`;
  const { error } = await client.storage.from(bucket).upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
  if (error) throw error;
  return { url: client.storage.from(bucket).getPublicUrl(path).data.publicUrl, path, bucket };
}
export async function removeUploadedImage(bucket: string, path: string) {
  const { error } = await requireSupabase().storage.from(bucket).remove([path]);
  if (error) throw error;
}
