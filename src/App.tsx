import { lazy, Suspense, Component, type ReactNode } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Loading } from './components/shared/Ui';
import { ProtectedRoute } from './routes/ProtectedRoute';
import Storefront from './pages/storefront/Storefront';
const Login = lazy(() => import('./pages/admin/Login'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Products = lazy(() => import('./pages/admin/Products'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const Settings = lazy(() => import('./pages/admin/Settings'));
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="empty-state"><h1>Có lỗi khi mở trang</h1><p>Vui lòng tải lại để tiếp tục.</p><button className="button primary" onClick={() => window.location.reload()}>Tải lại trang</button></main>;
    return this.props.children;
  }
}
export default function App() {
  return <ErrorBoundary><Suspense fallback={<Loading />}><Routes><Route path="/" element={<Storefront />} /><Route path="/admin/login" element={<Login />} /><Route element={<ProtectedRoute />}><Route path="/admin" element={<AdminLayout />}><Route index element={<Dashboard />} /><Route path="products" element={<Products />} /><Route path="categories" element={<Categories />} /><Route path="settings" element={<Settings />} /></Route></Route><Route path="*" element={<main className="empty-state"><h1>Góc này chưa có gì</h1><p>Quay về cửa hàng để khám phá những món đồ hay.</p><Link className="button primary" to="/">Về cửa hàng</Link></main>} /></Routes></Suspense></ErrorBoundary>;
}
