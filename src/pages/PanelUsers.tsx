import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { UserPlus, Pencil, Trash2, Shield, Clock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

interface PanelUser {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  active: boolean;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: string;
  permissions: string;
  active: boolean;
}

const defaultFormData: UserFormData = {
  username: '',
  email: '',
  password: '',
  role: 'user',
  permissions: '[]',
  active: true,
};

const roleOptions = [
  { value: 'admin', label: 'Administrator', description: 'Full system access' },
  { value: 'moderator', label: 'Moderator', description: 'User and channel management' },
  { value: 'user', label: 'User', description: 'Basic read-only access' },
];

export function PanelUsers() {
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PanelUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users from backend
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data for now - this would be a real API call
      const mockUsers: PanelUser[] = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@localhost',
          role: 'admin',
          permissions: '["*"]',
          created_at: '2025-06-16T13:34:29Z',
          updated_at: '2025-06-16T13:34:29Z',
          last_login: '2025-06-16T13:35:07Z',
          active: true,
        },
      ];
      setUsers(mockUsers);
    } catch (error) {
      toast.error('Failed to load panel users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // This would be a real API call to create user
      const newUser: PanelUser = {
        id: users.length + 1,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: null,
        active: formData.active,
      };

      setUsers([...users, newUser]);
      setFormData(defaultFormData);
      setIsAddDialogOpen(false);
      toast.success('Panel user created successfully');
    } catch (error) {
      toast.error('Failed to create panel user');
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser || !formData.username || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // This would be a real API call to update user
      const updatedUsers = users.map(user =>
        user.id === editingUser.id
          ? {
              ...user,
              username: formData.username,
              email: formData.email,
              role: formData.role,
              permissions: formData.permissions,
              active: formData.active,
              updated_at: new Date().toISOString(),
            }
          : user
      );

      setUsers(updatedUsers);
      setEditingUser(null);
      setFormData(defaultFormData);
      setIsEditDialogOpen(false);
      toast.success('Panel user updated successfully');
    } catch (error) {
      toast.error('Failed to update panel user');
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      // This would be a real API call to delete user
      setUsers(users.filter(user => user.id !== userId));
      toast.success('Panel user deleted successfully');
    } catch (error) {
      toast.error('Failed to delete panel user');
      console.error('Error deleting user:', error);
    }
  };

  const openEditDialog = (user: PanelUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't pre-fill password for security
      role: user.role,
      permissions: user.permissions,
      active: user.active,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingUser(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-dynamic';
      case 'moderator': return 'bg-orange-600';
      case 'user': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Users</h1>
          <p className="text-muted-foreground">
            Manage webpanel user accounts and permissions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Panel User</DialogTitle>
              <DialogDescription>
                Create a new webpanel user account with specific role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Panel Users ({users.length})
          </CardTitle>
          <CardDescription>
            Manage webpanel users who can access this administration interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? 'default' : 'secondary'}>
                        {user.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(user.last_login)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.id !== 1 && ( // Prevent deleting the main admin user
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Panel User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the user "{user.username}"?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Panel User</DialogTitle>
            <DialogDescription>
              Update user account information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username *</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-sm text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
