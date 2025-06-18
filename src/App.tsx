import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Users } from '@/pages/Users';
import { Channels } from '@/pages/Channels';
import { Servers } from '@/pages/Servers';
import { ServerBans } from '@/pages/ServerBans';
import { Plugins } from '@/pages/Plugins';
import { Logs } from '@/pages/Logs';
import { Settings } from '@/pages/Settings';
import { RoleEditor } from '@/pages/RoleEditor';
import { PanelUsers } from '@/pages/PanelUsers';
import { Login } from '@/pages/Login';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PERMISSIONS } from '@/lib/permissions';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// App content that needs auth context
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <AppLayout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.NETWORK_VIEW]}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.USERS_VIEW]}>
              <Users />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="channels" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.CHANNELS_VIEW]}>
              <Channels />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="servers" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.SERVER_VIEW]}>
              <Servers />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="server-bans" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.BANS_VIEW]}>
              <ServerBans />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="panel-users" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.PANEL_USERS]}>
              <PanelUsers />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="plugins" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.SERVER_MANAGE]}>
              <Plugins />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="logs" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.LOGS_VIEW]}>
              <Logs />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="settings" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.ADMIN_SETTINGS]}>
              <Settings />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="roles" 
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.PANEL_ROLES]}>
              <RoleEditor />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Catch all - redirect to login if not authenticated, dashboard if authenticated */}
      <Route 
        path="*" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <AppContent />
            <Toaster richColors />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
