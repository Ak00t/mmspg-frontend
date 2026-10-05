import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // In a real application, you would verify authentication status here
  // For example, checking a token in localStorage or a context state
  const isAuthenticated = true;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}
