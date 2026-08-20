import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminStatistics from './pages/admin/AdminStatistics';

import InventoryDashboard from './pages/inventory/InventoryDashboard';
import InventoryProducts from './pages/inventory/InventoryProducts';
import InventoryLowStock from './pages/inventory/InventoryLowStock';
import InventorySales from './pages/inventory/InventorySales';

import POSPage from './pages/cashier/POSPage';
import CashierTransactions from './pages/cashier/CashierTransactions';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/statistics" element={<AdminStatistics />} />
            </Route>
          </Route>

          {/* Inventory Manager Routes */}
          <Route element={<ProtectedRoute allowedRoles={['inventory_manager']} />}>
            <Route element={<Layout />}>
              <Route path="/inventory/dashboard" element={<InventoryDashboard />} />
              <Route path="/inventory/products" element={<InventoryProducts />} />
              <Route path="/inventory/low-stock" element={<InventoryLowStock />} />
              <Route path="/inventory/sales" element={<InventorySales />} />
            </Route>
          </Route>

          {/* Cashier Routes */}
          <Route element={<ProtectedRoute allowedRoles={['cashier']} />}>
            <Route element={<Layout />}>
              <Route path="/pos" element={<POSPage />} />
              <Route path="/cashier/transactions" element={<CashierTransactions />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
