import { PackageOpen, AlertCircle, RefreshCw, LoaderCircle, House } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { httpUrl } from '../../utils/format';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brand"><span className="brand-icon"><House size={19} strokeWidth={1.8} /></span><span>nhà<span className="brand-dot">.</span></span>{!compact && <span className="brand-caption">một góc nhỏ, nhiều điều hay</span>}</span>;
}
export function Spinner() { return <LoaderCircle className="spin" size={18} aria-hidden="true" />; }
export function Loading({ label = 'Đang tải…' }: { label?: string }) {
  return <div className="loading-state" role="status"><Spinner /><span>{label}</span></div>;
}
export function Empty({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><PackageOpen size={32} strokeWidth={1.5} /></span><h3>{title}</h3>{description && <p>{description}</p>}{children}</div>;
}
export function ErrorState({ retry }: { retry: () => void }) {
  return <div className="empty-state" role="alert"><AlertCircle size={32} /><h3>Chưa thể tải dữ liệu</h3><p>Kiểm tra kết nối mạng và thử lại nhé.</p><button className="button secondary" onClick={retry}><RefreshCw size={16} />Thử lại</button></div>;
}
export function Photo({ src, alt, className = '', eager = false }: { src: string | null; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  const valid = src?.startsWith('/images/') ? src : httpUrl(src);
  if (!valid || failed === src) return <div className={`image-fallback ${className}`} role="img" aria-label={alt}><PackageOpen size={36} strokeWidth={1.3} /><span>Ảnh đang cập nhật</span></div>;
  return <img src={valid} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(src)} />;
}
export function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'on' : ''}`} onClick={onChange} disabled={disabled}><span /></button>;
}
