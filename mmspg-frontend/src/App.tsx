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

// Merchant Views
import MerchantDashboard from './views/merchant/Dashboard';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Default Redirect to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="merchant-approvals" element={<MerchantApprovals />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="/admin/mcc-configuration" element={<MccManagement />} />
            <Route path="terminals" element={<AdminTerminals />} />
            <Route path="staff-users" element={<StaffUsers />} />
          </Route>
        </Route>

        {/* Protected Merchant Routes */}
        <Route path="/merchant" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="dashboard" element={<MerchantDashboard />} />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );

}
