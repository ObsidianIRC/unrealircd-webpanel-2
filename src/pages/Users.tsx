import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, UserX, MessageCircle, Shield } from 'lucide-react';

// Mock user data
const users = [
  {
    nick: 'Guest0',
    country: '',
    hostIP: 'localhost (127.0.0.1)',
    account: 'Valware',
    oper: 'V',
    connectedTo: 'irc.valware.uk',
    reputation: 0,
    modes: '+i',
    connectTime: '2 min ago',
  }
];

export function Users() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user =>
    user.nick.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.hostIP.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Overview</h1>
          <p className="text-muted-foreground">
            Manage and monitor connected users on your IRC network
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          {filteredUsers.length} users online
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Click on a username to view more information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Show Operators Only
            </Button>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nick</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Host / IP</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Oper</TableHead>
                  <TableHead>Connected to</TableHead>
                  <TableHead>Reputation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.nick}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{user.nick}</span>
                          {user.modes && (
                            <Badge variant="secondary" className="text-xs">
                              {user.modes}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.country || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{user.hostIP}</TableCell>
                      <TableCell>{user.account}</TableCell>
                      <TableCell>
                        {user.oper ? (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            {user.oper}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{user.connectedTo}</TableCell>
                      <TableCell>{user.reputation}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <UserX className="h-4 w-4 mr-2" />
                              Kick User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
