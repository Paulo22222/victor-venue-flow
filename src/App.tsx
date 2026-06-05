import { lazy, Suspense, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

// Code-splitting por rota — reduz fortemente o bundle inicial
const PublicHome = lazy(() => import("./pages/PublicHome"));
const PublicEvent = lazy(() => import("./pages/PublicEvent"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminWizard = lazy(() => import("./pages/admin/AdminWizard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminTeamsView = lazy(() => import("./pages/admin/AdminTeamsView"));
const AdminModalities = lazy(() => import("./pages/admin/AdminModalities"));
const AdminVenues = lazy(() => import("./pages/admin/AdminVenues"));
const AdminBadges = lazy(() => import("./pages/admin/AdminBadges"));
const OrganizerLayout = lazy(() => import("./pages/organizer/OrganizerLayout"));
const OrganizerDashboard = lazy(() => import("./pages/organizer/OrganizerDashboard"));
const OrganizerTeams = lazy(() => import("./pages/organizer/OrganizerTeams"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const RequireRole = ({ role, children }: { role: 'admin' | 'organizer'; children: ReactNode }) => {
  const { user, loading, role: myRole } = useAuth();
  if (loading) return <FullPageLoader />;
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
          <Suspense fallback={<FullPageLoader />}>
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
                <Route path="/admin/modalities" element={<AdminModalities />} />
                <Route path="/admin/venues" element={<AdminVenues />} />
                <Route path="/admin/badges" element={<AdminBadges />} />
                <Route path="/admin/athletes" element={<OrganizerTeams />} />
                <Route path="/admin/users" element={<AdminUsers />} />
              </Route>

              {/* Organizador */}
              <Route element={<RequireRole role="organizer"><OrganizerLayout /></RequireRole>}>
                <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
                <Route path="/organizer/teams" element={<OrganizerTeams />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
