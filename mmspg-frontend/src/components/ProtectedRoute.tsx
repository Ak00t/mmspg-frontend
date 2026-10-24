import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    // Check expiration if exp field is present (exp is in seconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    // If not a standard JWT or cannot decode, but token string exists, treat as valid string token
    return token.trim().length > 0;
  }
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const location = useLocation();
  const token = localStorage.getItem('token') || localStorage.getItem('mmspg_token');
  const userRole = localStorage.getItem('userRole');

  // If no token or token is expired, redirect to login
  if (!token || !isTokenValid(token)) {
    // Clean up any stale localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('mmspg_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('merchantId');
    localStorage.removeItem('userName');

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, ensure user has permission
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    if (userRole === 'MERCHANT') {
      return <Navigate to="/merchant/dashboard" replace />;
    }
    if (userRole === 'SUPPORT') {
      return <Navigate to="/support/dashboard" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
