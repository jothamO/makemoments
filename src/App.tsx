import { useEffect, lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useMutation } from "convex/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Homepage from "./pages/Homepage";
import CreatePage from "./pages/CreatePage";
import { Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import CelebrationView from "./pages/CelebrationView";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import { AuthProvider } from "./contexts/AuthContext";
import { BottomNavigation } from "./components/public/BottomNavigation";
import { ReloadPrompt } from "./components/ReloadPrompt";
import { setAuditReporter, initIntegrityChecks, teardownIntegrityChecks } from "./lib/integrity";
import { GlobalLoader } from "./components/ui/GlobalLoader";

// Lazy-loaded routes (reduces initial bundle by ~40%)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminEvents = lazy(() => import("./pages/admin/Events"));
const AdminEventEditor = lazy(() => import("./pages/admin/EventEditor"));
const AdminSales = lazy(() => import("./pages/admin/Sales"));
const AdminCelebrations = lazy(() => import("./pages/admin/Celebrations"));
const AdminFiles = lazy(() => import("./pages/admin/FilesPage"));
const AdminPricing = lazy(() => import("./pages/admin/Pricing"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminMail = lazy(() => import("./pages/admin/Mail"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const MyMoments = lazy(() => import("./pages/MyMoments"));
const Settings = lazy(() => import("./pages/Settings"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const AdminPages = lazy(() => import("./pages/admin/Pages"));

const queryClient = new QueryClient();

/** Passive security monitor — connects integrity.ts to Convex */
function IntegrityGuard() {
  const logEvent = useMutation(api.audit.logSecurityEvent);
  useEffect(() => {
    setAuditReporter((event, metadata) => {
      logEvent({ event, metadata }).catch(() => { });
    });
    initIntegrityChecks();
    return () => teardownIntegrityChecks();
  }, [logEvent]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ThemeProvider>
          <Sonner />
          <ReloadPrompt />
          <IntegrityGuard />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<GlobalLoader />}>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/create" element={<CreateRedirect />} />
                <Route path="/:eventSlug/create" element={<CreatePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/my-moments" element={
                  <ProtectedRoute>
                    <MyMoments />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />

                {/* Admin */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="events" element={<AdminEvents />} />
                  <Route path="events/new" element={<AdminEventEditor />} />
                  <Route path="events/:id/edit" element={<AdminEventEditor />} />
                  <Route path="sales" element={<AdminSales />} />
                  <Route path="celebrations" element={<AdminCelebrations />} />
                  <Route path="files" element={<AdminFiles />} />
                  <Route path="pricing" element={<AdminPricing />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="mail" element={<AdminMail />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="pages" element={<AdminPages />} />
                </Route>

                {/* CMS content pages — must be before /:slug catch-all */}
                <Route path="/about" element={<ContentPage />} />
                <Route path="/help-center" element={<ContentPage />} />
                <Route path="/privacy" element={<ContentPage />} />
                <Route path="/terms" element={<ContentPage />} />

                {/* Celebration view - must be after admin routes */}
                <Route path="/:slug" element={<CelebrationView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <BottomNavigation />
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

function CreateRedirect() {
  const activeEvent = useQuery(api.events.getActive);
  if (activeEvent) {
    return <Navigate to={`/${activeEvent.slug}/create`} replace />;
  }
  return <Navigate to="/" replace />;
}

export default App;
