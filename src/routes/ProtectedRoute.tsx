import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ErrorState, Loading } from '../components/shared/Ui';
export function ProtectedRoute() {
  const auth = useAuth();
  if (auth.loading) return <Loading label="Đang kiểm tra đăng nhập…" />;
  if (auth.error) return <ErrorState retry={auth.retry} />;
  if (!auth.session || !auth.admin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
