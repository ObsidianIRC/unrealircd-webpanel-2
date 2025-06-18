import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { apiService, type Role, type Permission } from '@/lib/api';

export function RoleEditor() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [formLoading, setFormLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        apiService.getRoles(),
        apiService.getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingRole) {
        // Update existing role
        const updatedRole = await apiService.updateRole(editingRole.id, formData);
        setRoles(prev => prev.map(role =>
          role.id === editingRole.id ? updatedRole : role
        ));
      } else {
        // Create new role
        const newRole = await apiService.createRole(formData);
        setRoles(prev => [...prev, newRole]);
      }
      closeDialog();
    } catch (error) {
      console.error('Failed to save role:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (roleId: number) => {
    try {
      await apiService.deleteRole(roleId);
      setRoles(prev => prev.filter(role => role.id !== roleId));
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => id !== permissionId)
      }));
    }
  };

  const isPermissionSelected = (permissionId: string) => {
    return formData.permissions.includes(permissionId) || formData.permissions.includes('*');
  };

  const isAllPermissionsSelected = formData.permissions.includes('*');

  const handleAllPermissionsChange = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, permissions: ['*'] }));
    } else {
      setFormData(prev => ({ ...prev, permissions: [] }));
    }
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getRolePermissionCount = (role: Role) => {
    if (role.permissions.includes('*')) {
      return 'All Permissions';
    }
    return `${role.permissions.length} permission${role.permissions.length !== 1 ? 's' : ''}`;
  };

  const getRoleBadgeVariant = (role: Role) => {
    if (role.name === 'admin') return 'destructive';
    if (role.name === 'moderator') return 'default';
    if (role.name === 'operator') return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Role Editor</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading roles...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Role Editor</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions for the webpanel
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </DialogTitle>
              <DialogDescription>
                {editingRole
                  ? 'Update the role details and permissions.'
                  : 'Create a new role and assign permissions.'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., moderator, operator"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the role"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Permissions</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the permissions for this role. Users with this role will have access to the selected features.
                </p>

                {/* All Permissions Toggle */}
                <div className="mb-4 p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-permissions"
                      checked={isAllPermissionsSelected}
                      onCheckedChange={handleAllPermissionsChange}
                    />
                    <Label htmlFor="all-permissions" className="font-medium text-red-600">
                      All Permissions (Super Admin)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Grant complete administrative access to all features
                  </p>
                </div>

                {/* Permission Categories */}
                <div className="space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 capitalize text-lg">
                        {category} Permissions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={isPermissionSelected(permission.id)}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(permission.id, checked as boolean)
                              }
                              disabled={isAllPermissionsSelected}
                            />
                            <div className="space-y-1 flex-1">
                              <Label
                                htmlFor={permission.id}
                                className="text-sm font-medium leading-none"
                              >
                                {permission.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              Active roles in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Available permissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Roles</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(role => role.permissions.includes('*')).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Roles with full access
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles Management</CardTitle>
          <CardDescription>
            View and manage all user roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRoleBadgeVariant(role)}>
                        {role.name}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {role.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {role.permissions.includes('*') ? (
                        <Badge variant="destructive" className="text-xs">
                          All Permissions
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {getRolePermissionCount(role)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(role.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDialog(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Role
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Role
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Role</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{role.name}" role?
                                This action cannot be undone and users with this role
                                will lose their assigned permissions.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(role.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete Role
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {roles.length === 0 && (
            <div className="text-center py-8">
              <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No roles found</p>
              <Button variant="outline" className="mt-2" onClick={() => openDialog()}>
                Create your first role
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
