import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import UserLayout from '../layouts/UserLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import VerifyEmailPage from '../pages/public/VerifyEmailPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import FindItem from '../pages/items/FindItem';

// User Pages
import DashboardPage from '../pages/user/DashboardPage';
import BrowsePage from '../pages/user/BrowsePage';
import ReportLostPage from '../pages/user/ReportLostPage';
import ReportFoundPage from '../pages/user/ReportFoundPage';
import ItemDetailsPage from '../pages/user/ItemDetailsPage';
import MyReportsPage from '../pages/user/MyReportsPage';
import MatchesPage from '../pages/user/MatchesPage';
import ClaimsPage from '../pages/user/ClaimsPage';
import NotificationsPage from '../pages/user/NotificationsPage';
import ProfilePage from '../pages/user/ProfilePage';
import RecoveryAssistantPage from '../pages/user/RecoveryAssistantPage';

// Admin Pages
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminItemsPage from '../pages/admin/AdminItemsPage';
import AdminClaimsPage from '../pages/admin/AdminClaimsPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';

import { LoadingSpinner } from '../components/UIComponents';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Checking authentication status..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Verifying administrative credentials..." />;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Verifying super administrator credentials..." />;
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public / Landing Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/find" element={<FindItem />} />
        <Route path="/items/:id" element={<ItemDetailsPage />} />
      </Route>

      {/* Standalone Public Auth Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Authenticated User Portal (UserLayout) */}
      <Route
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assistant" element={<RecoveryAssistantPage />} />
        <Route path="/report-lost" element={<ReportLostPage />} />

        <Route path="/report-found" element={<ReportFoundPage />} />
        <Route path="/my-reports" element={<MyReportsPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/claims" element={<ClaimsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Authenticated Admin Portal (AdminLayout) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route
          path="users"
          element={
            <SuperAdminRoute>
              <AdminUsersPage />
            </SuperAdminRoute>
          }
        />
        <Route path="items" element={<AdminItemsPage />} />
        <Route path="claims" element={<AdminClaimsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
