import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { LockKeyhole, ArrowLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { signIn } from '../../services/auth.service';
import { isConfigured } from '../../services/supabase';
import { Brand, ErrorState, Loading, Spinner } from '../../components/shared/Ui';
import { errorMessage } from '../../utils/format';
export default function Login() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  if (auth.loading) return <Loading />;
  if (auth.error) return <ErrorState retry={auth.retry} />;
  if (auth.admin) return <Navigate to="/admin" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try { await signIn(String(form.get('email')), String(form.get('password'))); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <main className="login-page"><Link className="back-link" to="/"><ArrowLeft size={16} />Về cửa hàng</Link><div className="login-card"><Brand compact /><div className="login-icon"><LockKeyhole size={26} strokeWidth={1.6} /></div><h1>Chào mừng về nhà.</h1><p>Đăng nhập để chăm chút góc nhỏ của bạn.</p>{!isConfigured && <div className="notice" role="status"><strong>Chưa kết nối Supabase</strong><span>Giao diện đang dùng dữ liệu mẫu. Làm theo README để kết nối database và tạo tài khoản admin.</span></div>}<form onSubmit={event => void submit(event)}><label className="field">Email<input name="email" type="email" placeholder="ban@email.com" autoComplete="username" required disabled={busy} /></label><label className="field">Mật khẩu<span className="password-field"><input name="password" type={visible ? 'text' : 'password'} placeholder="Nhập mật khẩu của bạn" autoComplete="current-password" required disabled={busy} /><button type="button" className="icon-button" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary login-submit" disabled={busy || !isConfigured}>{busy ? <Spinner /> : null}Đăng nhập<ArrowRight size={17} /></button></form><small>Chỉ dành cho quản trị viên cửa hàng</small></div></main>;
}
