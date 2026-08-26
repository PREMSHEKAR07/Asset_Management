import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AssetProvider, useAssetManager } from './hooks/useAssetManager';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Assets from './pages/Assets';
import Categories from './pages/Categories';
import AssignAsset from './pages/AssignAsset';
import ReturnAsset from './pages/ReturnAsset';
import Repairs from './pages/Repairs';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ActivityLog from './pages/ActivityLog';
import Login from './pages/Login';
import Licenses from './pages/Licenses';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeSettings from './pages/EmployeeSettings';

const AuthGuard = ({ allowedRoles }) => {
  const { currentUser } = useAssetManager();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={currentUser.role === 'Admin' ? '/' : '/employee'} replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <AssetProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<AuthGuard allowedRoles={['Admin']} />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="assets" element={<Assets />} />
              <Route path="categories" element={<Categories />} />
              <Route path="licenses" element={<Licenses />} />
              <Route path="assign-assets" element={<AssignAsset />} />
              <Route path="return-assets" element={<ReturnAsset />} />
              <Route path="repairs" element={<Repairs />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="activity-log" element={<ActivityLog />} />
            </Route>
          </Route>

          {/* Protected Employee Routes */}
          <Route element={<AuthGuard allowedRoles={['Employee']} />}>
            <Route path="/employee" element={<DashboardLayout />}>
              <Route index element={<EmployeeDashboard />} />
              <Route path="settings" element={<EmployeeSettings />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AssetProvider>
  );
}

export default App;
