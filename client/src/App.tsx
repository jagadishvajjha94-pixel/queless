import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import CustomerDashboard from './pages/CustomerDashboard.tsx';
import BusinessDashboard from './pages/BusinessDashboard.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';

// Common Components
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import DemoBanner from './components/DemoBanner.tsx';
import { DEMO_MODE } from './config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard Route: Requires login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Guard Route: Checks specific roles
const RoleRoute = ({ children, roles }: { children: React.ReactNode; roles: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {DEMO_MODE && <DemoBanner />}
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={user ? <Navigate to={`/${user.role}-dashboard`} replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to={`/${user.role}-dashboard`} replace /> : <RegisterPage />}
          />

          {/* Protected Dashboards */}
          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['customer']}>
                  <CustomerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/business_owner-dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['business_owner']}>
                  <BusinessDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <AppContent />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
