import { Routes, Route } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";

import Dashboard from "../pages/user/Dashboard";
import Complaints from "../pages/user/Complaints";
import Profile from "../pages/user/Profile";

import CreateComplaint from "../pages/user/CreateComplaint";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/complaints/create" element={<CreateComplaint />} />
    </Routes>
  );
}

export default AppRoutes;
