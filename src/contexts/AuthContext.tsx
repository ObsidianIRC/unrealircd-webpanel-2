import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // For now, assume token is valid and set a basic user
          // In a real app, you'd validate the token with your API
          setUser({
            id: '1',
            username: 'admin',
            role: 'admin',
            permissions: ['*']
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
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
      // Import API service dynamically to avoid circular dependency
      const { apiService } = await import('@/lib/api');
      const response = await apiService.login(username, password);

      if (response.success && response.user) {
        const userData = {
          id: response.user.id.toString(),
          username: response.user.username,
          role: response.user.role,
          permissions: JSON.parse(response.user.permissions || '[]')
        };

        setUser(userData);
        if (response.token) {
          localStorage.setItem('authToken', response.token);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
