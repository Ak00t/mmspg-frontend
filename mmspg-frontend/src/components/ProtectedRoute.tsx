import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const token = localStorage.getItem('token');
  const userRole = (localStorage.getItem('userRole') || '').toUpperCase();

  // Redirect to login if user is not authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If role restriction is set and user's role is not allowed, redirect to their role's dashboard
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'SUPPORT') {
      return <Navigate to="/support/dashboard" replace />;
    }
    if (userRole === 'AUDITOR') {
      return <Navigate to="/auditor/dashboard" replace />;
    }
    if (userRole === 'MERCHANT') {
      return <Navigate to="/merchant/dashboard" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
