import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Hash,
  Server,
  Shield,
  Plug,
  FileText,
  Settings,
  UserCog,
  Activity,
} from 'lucide-react';
import { usePermissions, PERMISSIONS, type Permission } from '@/lib/permissions';

const navigationItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Network Management',
    items: [
      {
        title: 'Users',
        url: '/users',
        icon: Users,
      },
      {
        title: 'Channels',
        url: '/channels',
        icon: Hash,
      },
      {
        title: 'Servers',
        url: '/servers',
        icon: Server,
      },
    ],
  },
  {
    title: 'Moderation',
    items: [
      {
        title: 'Server Bans',
        url: '/server-bans',
        icon: Shield,
      },
      {
        title: 'Logs',
        url: '/logs',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'Panel Users',
        url: '/panel-users',
        icon: UserCog,
      },
      {
        title: 'Plugins',
        url: '/plugins',
        icon: Plug,
      },
      {
        title: 'Role Editor',
        url: '/roles',
        icon: UserCog,
      },
      {
        title: 'Settings',
        url: '/settings',
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="font-bold text-lg">UnrealIRCd</h1>
        </div>
        <p className="text-sm text-muted-foreground px-4 pb-2">Admin Panel</p>
      </SidebarHeader>
      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
