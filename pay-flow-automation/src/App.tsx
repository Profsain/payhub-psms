import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Auth } from "./pages/Auth";
import { ScheduleDemo } from "./pages/ScheduleDemo";
import { StaffDashboard } from "./components/dashboards/StaffDashboard";
import { InstitutionAdminDashboard } from "./components/dashboards/InstitutionAdminDashboard";
import { SuperAdminDashboard } from "./components/dashboards/SuperAdminDashboard";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  if (user) {
    // Redirect authenticated users to their appropriate dashboard
    if (user.role === 'staff') {
      return <Navigate to="/staff-dashboard" replace />;
    } else if (user.role === 'institution_admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role === 'super_admin') {
      return <Navigate to="/super-admin-dashboard" replace />;
    }
  }
  
  return <Index />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppRoutes />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/schedule-demo" element={<ScheduleDemo />} />
            <Route 
              path="/staff-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['institution_admin']}>
                  <InstitutionAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/super-admin-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
