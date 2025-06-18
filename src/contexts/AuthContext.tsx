import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { getPermissionsForRole, type Permission } from '@/lib/permissions';

interface User {
  id: string;
  username: string;
  role: string;
  permissions: Permission[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Try to decode token or validate with server
          console.log('🔍 Found existing auth token');
          // For now, create a mock user - in production, validate token with server
          setUser({
            id: '1',
            username: 'admin',
            role: 'admin',
            permissions: getPermissionsForRole('admin')
          });
        } else {
          console.log('🚫 No auth token found');
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log(`🔐 Login attempt: ${username}`);
      
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('📥 Login response:', data);

      if (data.success && data.user && data.token) {
        // Get permissions based on user role
        const userPermissions = getPermissionsForRole(data.user.role);
        
        const userData = {
          id: data.user.id.toString(),
          username: data.user.username,
          role: data.user.role,
          permissions: userPermissions
        };

        setUser(userData);
        localStorage.setItem('authToken', data.token);
        console.log('✅ Login successful, user set:', userData);
        return true;
      } else {
        console.error('❌ Login failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    setUser(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Export the useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };