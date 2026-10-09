import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import AdminDashboard from "../pages/admin/AdminDashboard";
import Complaints from "../pages/user/Complaints";
import Profile from "../pages/user/Profile";
import CreateComplaint from "../pages/user/CreateComplaint";

import DashboardRedirector from "../components/auth/DashboardRedirector";

import Forbidden from "../pages/Forbidden";
import NotFound from "../pages/NotFound";

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<DashboardRedirector />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/complaints" element={<Complaints />} />
        <Route path="/complaints/create" element={<CreateComplaint />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* 403 */}
      <Route path="/forbidden" element={<Forbidden />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
