import { LayoutDashboard, Package, Tags, Settings, LogOut, ArrowUpRight } from 'lucide-react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Brand, Spinner } from '../shared/Ui';
import { signOut } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import { errorMessage } from '../../utils/format';
const items = [{ to: '/admin', label: 'Tổng quan', icon: LayoutDashboard }, { to: '/admin/products', label: 'Sản phẩm', icon: Package }, { to: '/admin/categories', label: 'Danh mục', icon: Tags }, { to: '/admin/settings', label: 'Cửa hàng', icon: Settings }];
export default function AdminLayout() {
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  async function logout() {
    setBusy(true);
    try { await signOut(); navigate('/admin/login', { replace: true }); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <div className="admin-shell"><aside className="admin-sidebar"><Link to="/" aria-label="Về storefront"><Brand compact /></Link><span className="admin-label">GÓC QUẢN TRỊ</span><nav aria-label="Quản trị">{items.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><item.icon size={19} /><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-bottom"><Link className="admin-nav-link" to="/" target="_blank">Xem storefront<ArrowUpRight size={17} /></Link><div className="admin-user"><span className="user-avatar">Q</span><div><strong>Quản trị viên</strong><small>{auth.session?.user.email}</small></div></div><button className="admin-nav-link" disabled={busy} onClick={() => void logout()}>{busy ? <Spinner /> : <LogOut size={18} />}Đăng xuất</button></div></aside><main className="admin-main"><Outlet /></main></div>;
}
