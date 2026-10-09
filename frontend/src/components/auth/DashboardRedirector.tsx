import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import Dashboard from "../../pages/user/Dashboard";

function DashboardRedirector() {
  const { user } = useAuth();

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
}

export default DashboardRedirector;