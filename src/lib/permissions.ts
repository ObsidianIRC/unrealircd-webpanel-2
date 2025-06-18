import { useAuth } from '@/contexts/AuthContext';

// Permission constants for better type safety
export const PERMISSIONS = {
  // Admin permissions
  ALL: '*',

  // Channel permissions
  CHANNELS_VIEW: 'channels.view',
  CHANNELS_MODERATE: 'channels.moderate',
  CHANNELS_MANAGE: 'channels.manage',

  // User permissions
  USERS_VIEW: 'users.view',
  USERS_KICK: 'users.kick',
  USERS_BAN: 'users.ban',
  USERS_MANAGE: 'users.manage',

  // Server permissions
  SERVER_VIEW: 'server.view',
  SERVER_MANAGE: 'server.manage',

  // Moderation permissions
  BANS_VIEW: 'bans.view',
  BANS_MANAGE: 'bans.manage',

  // Monitoring permissions
  LOGS_VIEW: 'logs.view',
  LOGS_MANAGE: 'logs.manage',

  // Panel permissions
  PANEL_USERS: 'panel.users',
  PANEL_SETTINGS: 'panel.settings',
  PANEL_ROLES: 'panel.roles',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: Permission): boolean {
  // If user has all permissions, they have access to everything
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }

  // Check if user has the specific permission
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

/**
 * React hook to check permissions for the current user
 */
export function usePermissions() {
  const { user } = useAuth();

  const userPermissions = user?.permissions || [];

  return {
    hasPermission: (permission: Permission) => hasPermission(userPermissions, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userPermissions, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userPermissions, permissions),
    isAdmin: () => hasPermission(userPermissions, PERMISSIONS.ALL),
    permissions: userPermissions,
  };
}

/**
 * Check if a user can access a specific route/page
 */
export function canAccessRoute(userPermissions: string[], route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/dashboard': [PERMISSIONS.SERVER_VIEW],
    '/users': [PERMISSIONS.USERS_VIEW],
    '/channels': [PERMISSIONS.CHANNELS_VIEW],
    '/servers': [PERMISSIONS.SERVER_VIEW],
    '/server-bans': [PERMISSIONS.BANS_VIEW],
    '/plugins': [PERMISSIONS.SERVER_MANAGE],
    '/logs': [PERMISSIONS.LOGS_VIEW],
    '/settings': [PERMISSIONS.PANEL_SETTINGS],
    '/role-editor': [PERMISSIONS.PANEL_ROLES, PERMISSIONS.ALL],
    '/panel-users': [PERMISSIONS.PANEL_USERS],
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) {
    return true; // If no specific permissions required, allow access
  }

  return hasAnyPermission(userPermissions, requiredPermissions);
}
