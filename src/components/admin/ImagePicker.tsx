import { useEffect, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Photo } from '../shared/Ui';
export default function ImagePicker({ existing, file, onChange, disabled = false, avatar = false }: { existing: string | null; file: File | null; onChange: (file: File | null) => void; disabled?: boolean; avatar?: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <div className={`image-picker ${avatar ? 'avatar-picker' : ''}`}><div className="upload-preview">{preview ? <img src={preview} alt="Xem trước ảnh mới" /> : <Photo src={existing} alt={avatar ? 'Ảnh đại diện' : 'Ảnh sản phẩm'} />}</div><div><label className={`button secondary upload-button ${disabled ? 'disabled' : ''}`}><Upload size={16} />Chọn ảnh<input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={event => {
    const selected = event.target.files?.[0];
    if (selected && !['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) { toast.error('Chọn ảnh JPG, PNG hoặc WebP.'); return; }
    if (selected && selected.size > 15 * 1024 * 1024) { toast.error('Ảnh tối đa 15 MB trước khi nén.'); return; }
    onChange(selected || null); event.target.value = '';
  }} aria-label={avatar ? 'Chọn ảnh đại diện' : 'Chọn ảnh sản phẩm'} /></label><p>JPG, PNG hoặc WebP. Ảnh được nén tự động trước khi tải lên.</p>{file && <button type="button" className="text-button" disabled={disabled} onClick={() => onChange(null)}><X size={14} />Bỏ ảnh vừa chọn</button>}</div></div>;
}
