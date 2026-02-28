import { useEffect } from "react";
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
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEvents from "./pages/admin/Events";
import AdminEventEditor from "./pages/admin/EventEditor";
import AdminSales from "./pages/admin/Sales";
import AdminCelebrations from "./pages/admin/Celebrations";
import AdminFiles from "./pages/admin/FilesPage";
import AdminPricing from "./pages/admin/Pricing";
import AdminPayments from "./pages/admin/Payments";
import AdminMail from "./pages/admin/Mail";
import AdminUsers from "./pages/admin/Users";
import AdminLayout from "./components/admin/AdminLayout";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import MyMoments from "./pages/MyMoments";
import Settings from "./pages/Settings";
import { useAuth } from "./hooks/useAuth";
import { AuthProvider } from "./contexts/AuthContext";
import { BottomNavigation } from "./components/public/BottomNavigation";
import { ReloadPrompt } from "./components/ReloadPrompt";
import { setAuditReporter, initIntegrityChecks, teardownIntegrityChecks } from "./lib/integrity";

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
              </Route>

              {/* Celebration view - must be after admin routes */}
              <Route path="/:slug" element={<CelebrationView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
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
