import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import { AppLayout } from "./components/layout/AppLayout";
import { useRole } from "./hooks/useRole";
import { useSessionRestore } from "./hooks/useSessionRestore";

const LandingPage       = React.lazy(() => import("./pages/Landing"));
const LoginPage         = React.lazy(() => import("./pages/Login"));
const RegisterPage      = React.lazy(() => import("./pages/Register"));
const OnboardingPage    = React.lazy(() => import("./pages/Onboarding"));
const DashboardPage     = React.lazy(() => import("./pages/Dashboard"));
const CustomersPage     = React.lazy(() => import("./pages/Customers"));
const ItemsPage         = React.lazy(() => import("./pages/Items"));
const InvoicesPage      = React.lazy(() => import("./pages/Invoices"));
const InvoiceDetailPage = React.lazy(() => import("./pages/InvoiceDetail"));
const SubscriptionsPage = React.lazy(() => import("./pages/Subscriptions"));
const POSPage           = React.lazy(() => import("./pages/POS"));
const StaffPage         = React.lazy(() => import("./pages/Staff"));
const SettingsPage             = React.lazy(() => import("./pages/Settings"));
const RazorpaySubscriptionsPage = React.lazy(() => import("./pages/RazorpaySubscriptions"));

const Loader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

/** Redirect authenticated + onboarded users away from public pages */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, business } = useAuthStore();
  if (isAuthenticated && business?.onboardingComplete) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, business } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!business?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PermissionRoute({
  permission, children,
}: { permission: keyof ReturnType<typeof useRole>; children: React.ReactNode }) {
  const perms = useRole();
  if (!perms[permission]) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const wrap = (child: React.ReactNode) => (
  <PrivateRoute><AppLayout>{child}</AppLayout></PrivateRoute>
);

function AppRoutes() {
  useSessionRestore();
  return (
    <React.Suspense fallback={<Loader />}>
      <Routes>
        {/* ── Public / Marketing ───────────────────────────────── */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* ── Onboarding ───────────────────────────────────────── */}
        <Route path="/onboarding" element={
          <OnboardingRoute><OnboardingPage /></OnboardingRoute>
        } />

        {/* ── All authenticated roles ───────────────────────────── */}
        <Route path="/dashboard"    element={wrap(<DashboardPage />)} />
        <Route path="/customers"    element={wrap(<CustomersPage />)} />
        <Route path="/items"        element={wrap(<ItemsPage />)} />
        <Route path="/invoices"     element={wrap(<InvoicesPage />)} />
        <Route path="/invoices/:id" element={wrap(<InvoiceDetailPage />)} />

        {/* ── owner | staff ────────────────────────────────────── */}
        <Route path="/pos" element={
          <PrivateRoute>
            <AppLayout>
              <PermissionRoute permission="canUsePOS"><POSPage /></PermissionRoute>
            </AppLayout>
          </PrivateRoute>
        } />

        {/* ── owner only ───────────────────────────────────────── */}
        <Route path="/subscriptions" element={
          <PrivateRoute>
            <AppLayout>
              <PermissionRoute permission="canManageSubscriptions"><SubscriptionsPage /></PermissionRoute>
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/razorpay-subscriptions" element={
          <PrivateRoute>
            <AppLayout>
              <PermissionRoute permission="canManageSubscriptions"><RazorpaySubscriptionsPage /></PermissionRoute>
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/staff" element={
          <PrivateRoute>
            <AppLayout>
              <PermissionRoute permission="canManageStaff"><StaffPage /></PermissionRoute>
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <AppLayout>
              <PermissionRoute permission="canManageSettings"><SettingsPage /></PermissionRoute>
            </AppLayout>
          </PrivateRoute>
        } />

        {/* ── Fallback ─────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}

export default function App() {
  return <AppRoutes />;
}
