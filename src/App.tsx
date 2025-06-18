import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
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
import { useAuth } from '@/hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="channels" element={<Channels />} />
                <Route path="servers" element={<Servers />} />
                <Route path="server-bans" element={<ServerBans />} />
                <Route path="panel-users" element={<PanelUsers />} />
                <Route path="plugins" element={<Plugins />} />
                <Route path="logs" element={<Logs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="roles" element={<RoleEditor />} />
              </Route>
            </Routes>
            <Toaster richColors />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
