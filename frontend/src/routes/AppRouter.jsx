import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLES } from "../data/mockData";
import AppLayout from "../components/layout/AppLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Campaigns from "../pages/Campaigns";
import CampaignCreate from "../pages/CampaignCreate";
import StoreSelection from "../pages/StoreSelection";
import DCO from "../pages/DCO";
import Reporting from "../pages/Reporting";
import AccountManagement from "../pages/AccountManagement";

/** Requires an authenticated session, otherwise sends the user to /login. */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/** Requires the current role to be in `roles`, otherwise back to the dashboard. */
function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/**
 * Application routes.
 *
 * `/login` is public. Everything else is rendered inside <AppLayout /> behind
 * <RequireAuth />, and the campaign/DCO/account routes additionally enforce the
 * role model with <RequireRole />.
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/campagnes"
          element={
            <RequireRole roles={[ROLES.ADMIN, ROLES.MEDIA_BUYER]}>
              <Campaigns />
            </RequireRole>
          }
        />
        <Route
          path="/campagnes/nouvelle"
          element={
            <RequireRole roles={[ROLES.ADMIN, ROLES.MEDIA_BUYER]}>
              <CampaignCreate />
            </RequireRole>
          }
        />
        <Route path="/magasins" element={<StoreSelection />} />
        <Route
          path="/dco"
          element={
            <RequireRole roles={[ROLES.ADMIN, ROLES.MEDIA_BUYER]}>
              <DCO />
            </RequireRole>
          }
        />
        <Route path="/reporting" element={<Reporting />} />
        <Route
          path="/compte"
          element={
            <RequireRole roles={[ROLES.ADMIN]}>
              <AccountManagement />
            </RequireRole>
          }
        />
      </Route>

      {/* Defaults */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
