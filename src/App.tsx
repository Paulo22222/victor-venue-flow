import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import PublicHome from "./pages/PublicHome";
import PublicEvent from "./pages/PublicEvent";
import AuthPage from "./pages/AuthPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminWizard from "./pages/admin/AdminWizard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTeamsView from "./pages/admin/AdminTeamsView";
import OrganizerLayout from "./pages/organizer/OrganizerLayout";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import OrganizerTeams from "./pages/organizer/OrganizerTeams";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const RequireRole = ({ role, children }: { role: 'admin' | 'organizer'; children: ReactNode }) => {
  const { user, loading, role: myRole } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/admin" replace />;
  if (myRole !== role) {
    if (myRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (myRole === 'organizer') return <Navigate to="/organizer/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Público */}
            <Route path="/" element={<PublicHome />} />
            <Route path="/evento/:id" element={<PublicEvent />} />

            {/* Login */}
            <Route path="/admin" element={<AuthPage />} />

            {/* Admin */}
            <Route element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/wizard" element={<AdminWizard />} />
              <Route path="/admin/teams" element={<AdminTeamsView />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

            {/* Organizador */}
            <Route element={<RequireRole role="organizer"><OrganizerLayout /></RequireRole>}>
              <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
              <Route path="/organizer/teams" element={<OrganizerTeams />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
