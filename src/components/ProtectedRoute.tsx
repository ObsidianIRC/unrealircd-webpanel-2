import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute, PERMISSIONS, type Permission } from '@/lib/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, requiredPermissions, fallback }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // If not authenticated, don't show anything (handled by main app routing)
  if (!isAuthenticated || !user) {
    return null;
  }

  const userPermissions = user.permissions || [];

  // Check route-based permissions
  const hasRouteAccess = canAccessRoute(userPermissions, location.pathname);

  // Check specific permissions if provided
  let hasRequiredPermissions = true;
  if (requiredPermissions && requiredPermissions.length > 0) {
    hasRequiredPermissions = requiredPermissions.some(permission =>
      userPermissions.includes(permission) || userPermissions.includes(PERMISSIONS.ALL)
    );
  }

  const hasAccess = hasRouteAccess && hasRequiredPermissions;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-destructive/10 rounded-full p-3 w-fit">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <AlertTriangle className="h-5 w-5 text-muted-foreground inline mr-2" />
              <span className="text-sm text-muted-foreground">
                Required permissions: {requiredPermissions?.join(', ') || 'Route access'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Your current role: <strong>{user.role}</strong></p>
              <p>Your permissions: <strong>{userPermissions.join(', ')}</strong></p>
            </div>
            <p className="text-sm text-muted-foreground">
              Contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

interface ConditionalRenderProps {
  permissions: Permission | Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render content based on permissions
 */
export function ConditionalRender({ permissions, children, fallback = null }: ConditionalRenderProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const userPermissions = user.permissions || [];
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  const hasAccess = requiredPermissions.some(permission =>
    userPermissions.includes(permission) || userPermissions.includes(PERMISSIONS.ALL)
  );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
