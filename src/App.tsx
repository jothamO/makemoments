import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Homepage from "./pages/Homepage";
import CreatePage from "./pages/CreatePage";
import TemplateGallery from "./pages/TemplateGallery";
import StoryEditor from "./pages/StoryEditor";
import CelebrationView from "./pages/CelebrationView";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEvents from "./pages/admin/Events";
import AdminEventEditor from "./pages/admin/EventEditor";
import AdminTemplates from "./pages/admin/Templates";
import AdminTemplateEditor from "./pages/admin/TemplateEditor";
import AdminSales from "./pages/admin/Sales";
import AdminCelebrations from "./pages/admin/Celebrations";
import AdminLayout from "./components/admin/AdminLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/create/:eventSlug" element={<TemplateGallery />} />
            <Route path="/create/:eventSlug/:templateId" element={<StoryEditor />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="events/new" element={<AdminEventEditor />} />
              <Route path="events/:id/edit" element={<AdminEventEditor />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="templates/new" element={<AdminTemplateEditor />} />
              <Route path="templates/:id/edit" element={<AdminTemplateEditor />} />
              <Route path="sales" element={<AdminSales />} />
              <Route path="celebrations" element={<AdminCelebrations />} />
            </Route>

            {/* Celebration view - must be after admin routes */}
            <Route path="/:slug" element={<CelebrationView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
