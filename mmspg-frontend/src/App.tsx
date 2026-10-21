import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
//import { MerchantDashboard } from './features/main-merchant/pages/MerchantDashboardPage';


// Auth Views
import Login from './views/auth/Login';
import Register from './views/auth/Register';

// Admin Views
import AdminDashboard from './views/admin/AdminDashboard';
import MerchantApprovals from './views/admin/MerchantApprovals';
import BranchManagement from './views/admin/BranchManagement';
import MccManagement from './views/admin/MccManagement';
import AdminTerminals from './views/admin/AdminTerminals';
import StaffUsers from './views/admin/StaffUsers';
import StaffProfile from './views/admin/StaffProfile';

// Merchant Views
import MerchantDashboard from './views/merchant/Dashboard';
import ResetPassword from './views/auth/ResetPassword';
import ForgotPassword from './views/auth/ForgotPassword';

function RootRedirect() {
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('userRole') || '').toUpperCase();
  if (token) {
    if (role === 'SUPPORT') return <Navigate to="/support/dashboard" replace />;
    if (role === 'AUDITOR') return <Navigate to="/auditor/dashboard" replace />;
    if (role === 'MERCHANT') return <Navigate to="/merchant/dashboard" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Default Redirect to Role Dashboard or Login */}
        <Route path="/" element={<RootRedirect />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="merchant-approvals" element={<MerchantApprovals />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="mcc-configuration" element={<MccManagement />} />
            <Route path="terminals" element={<AdminTerminals />} />
            <Route path="staff-users" element={<StaffUsers />} />
            <Route path="profile" element={<StaffProfile />} />
          </Route>
        </Route>

        {/* Protected Support Routes */}
        <Route path="/support" element={<ProtectedRoute allowedRoles={['SUPPORT']} />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="merchant-approvals" element={<MerchantApprovals />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="mcc-configuration" element={<MccManagement />} />
            <Route path="terminals" element={<AdminTerminals />} />
            <Route path="profile" element={<StaffProfile />} />
          </Route>
        </Route>

        {/* Protected Auditor Routes */}
        <Route path="/auditor" element={<ProtectedRoute allowedRoles={['AUDITOR']} />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="merchant-approvals" element={<MerchantApprovals />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="mcc-configuration" element={<MccManagement />} />
            <Route path="terminals" element={<AdminTerminals />} />
            <Route path="profile" element={<StaffProfile />} />
          </Route>
        </Route>

        {/* Protected Merchant Routes */}
        <Route path="/merchant" element={<ProtectedRoute allowedRoles={['MERCHANT']} />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MerchantDashboard />} />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
