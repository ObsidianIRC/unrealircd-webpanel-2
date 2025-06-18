import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Search,
  MoreVertical,
  Users,
  Hash,
  Crown,
  Shield,
  UserX,
  Ban,
  MessageCircle,
  Eye,
  Volume2,
  VolumeX,
  Settings,
  UserPlus,
  Zap,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { channelService, type Channel, type ChannelUser } from '@/services/api';

export function Channels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch channels on component mount
  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const channelData = await channelService.getChannels();
      setChannels(channelData);
      toast.success(`Loaded ${channelData.length} channels`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load channels';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannelUsers = async (channelName: string) => {
    try {
      setLoadingUsers(true);
      const users = await channelService.getChannelUsers(channelName);
      
      // Update the selected channel with fresh user data
      if (selectedChannel && selectedChannel.name === channelName) {
        setSelectedChannel({
          ...selectedChannel,
          userList: users,
          users: users.length
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load channel users';
      toast.error(errorMessage);
      console.error('Error fetching channel users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserModeSymbol = (user: ChannelUser) => {
    if (user.modes.includes('o')) return '@'; // Op
    if (user.modes.includes('h')) return '%'; // Half-op
    if (user.modes.includes('v')) return '+'; // Voice
    return ''; // Regular user
  };

  const getModeColor = (user: ChannelUser) => {
    if (user.modes.includes('o')) return 'text-red-600 font-semibold';
    if (user.modes.includes('h')) return 'text-orange-600 font-medium';
    if (user.modes.includes('v')) return 'text-blue-600';
    return 'text-foreground';
  };

  const handleUserAction = async (action: string, channel: string, user: string, reason?: string) => {
    try {
      // In real app, this would make API call to your Go backend
      console.log(`Action: ${action}, Channel: ${channel}, User: ${user}, Reason: ${reason}`);

      switch (action) {
        case 'kick':
          toast.success(`Kicked ${user} from ${channel}`);
          break;
        case 'ban':
          toast.success(`Banned ${user} from ${channel}`);
          break;
        case 'op':
          toast.success(`Gave operator status to ${user} in ${channel}`);
          break;
        case 'deop':
          toast.success(`Removed operator status from ${user} in ${channel}`);
          break;
        case 'voice':
          toast.success(`Gave voice to ${user} in ${channel}`);
          break;
        case 'devoice':
          toast.success(`Removed voice from ${user} in ${channel}`);
          break;
        default:
          toast.info(`Performed ${action} on ${user} in ${channel}`);
      }

      // Refresh channel users after action
      await fetchChannelUsers(channel);
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const openChannelDetails = async (channel: Channel) => {
    setSelectedChannel(channel);
    setIsChannelDialogOpen(true);
    
    // Fetch fresh user data when opening channel details
    await fetchChannelUsers(channel.name);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Channels Overview</h1>
            <p className="text-muted-foreground">Loading channel data...</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading channels...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Channels Overview</h1>
            <p className="text-muted-foreground">Failed to load channel data</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchChannels} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channels Overview</h1>
          <p className="text-muted-foreground">
            Monitor and manage IRC channels on your network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            {filteredChannels.length} channels
          </Badge>
          <Button onClick={fetchChannels} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Management</CardTitle>
          <CardDescription>
            Click on a channel name to view users and moderation tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Channels Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Modes</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChannels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      {searchQuery ? 'No channels found matching your search' : 'No channels available'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChannels.map((channel) => (
                    <TableRow key={channel.name}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => openChannelDetails(channel)}
                          className="flex items-center gap-2 hover:text-primary text-left"
                        >
                          <Hash className="h-4 w-4" />
                          {channel.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {channel.users}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {channel.modes}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {channel.topic || <span className="text-muted-foreground">No topic</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {channel.created}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openChannelDetails(channel)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Channel Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Ban className="h-4 w-4 mr-2" />
                              Clear Channel
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
              Showing {filteredChannels.length} of {channels.length} channels
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Channel Details Dialog */}
      <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {selectedChannel?.name}
            </DialogTitle>
            <DialogDescription>
              Channel management and user moderation tools
            </DialogDescription>
          </DialogHeader>

          {selectedChannel && (
            <Tabs defaultValue="users" className="flex-1">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Users ({selectedChannel.userList?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="moderation">
                  <Shield className="h-4 w-4 mr-2" />
                  Moderation
                </TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Channel Users</CardTitle>
                        <CardDescription>
                          Users currently in {selectedChannel.name}
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => fetchChannelUsers(selectedChannel.name)} 
                        variant="outline" 
                        size="sm"
                        disabled={loadingUsers}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading users...
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedChannel.userList && selectedChannel.userList.length > 0 ? (
                          selectedChannel.userList.map((user, index) => (
                            <div key={`${user.nick}-${index}`} className="flex items-center justify-between p-2 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <span className={`font-mono text-sm ${getModeColor(user)}`}>
                                  {getUserModeSymbol(user)}{user.nick}
                                </span>
                                <div className="flex gap-1">
                                  {user.modes.map((mode, modeIndex) => (
                                    <Badge key={`${mode}-${modeIndex}`} variant="outline" className="text-xs">
                                      {mode}
                                    </Badge>
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Joined {new Date(user.joined * 1000).toLocaleTimeString()}
                                </span>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Private Message
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {!user.modes.includes('o') ? (
                                    <DropdownMenuItem
                                      onClick={() => handleUserAction('op', selectedChannel.name, user.nick)}
                                    >
                                      <Crown className="h-4 w-4 mr-2" />
                                      Give Op
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleUserAction('deop', selectedChannel.name, user.nick)}
                                    >
                                      <Crown className="h-4 w-4 mr-2" />
                                      Remove Op
                                    </DropdownMenuItem>
                                  )}
                                  {!user.modes.includes('v') ? (
                                    <DropdownMenuItem
                                      onClick={() => handleUserAction('voice', selectedChannel.name, user.nick)}
                                    >
                                      <Volume2 className="h-4 w-4 mr-2" />
                                      Give Voice
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleUserAction('devoice', selectedChannel.name, user.nick)}
                                    >
                                      <VolumeX className="h-4 w-4 mr-2" />
                                      Remove Voice
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleUserAction('kick', selectedChannel.name, user.nick, 'Kicked by admin')}
                                    className="text-orange-600"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Kick
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUserAction('ban', selectedChannel.name, user.nick, 'Banned by admin')}
                                    className="text-red-600"
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Ban
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No users in this channel
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Channel Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Channel Name</Label>
                        <Input value={selectedChannel.name} readOnly />
                      </div>
                      <div>
                        <Label>Modes</Label>
                        <Input value={selectedChannel.modes} readOnly />
                      </div>
                    </div>
                    <div>
                      <Label>Topic</Label>
                      <Input value={selectedChannel.topic} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Created</Label>
                        <Input value={selectedChannel.created} readOnly />
                      </div>
                      <div>
                        <Label>User Count</Label>
                        <Input value={selectedChannel.users.toString()} readOnly />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Moderation Tab */}
              <TabsContent value="moderation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Moderation Tools</CardTitle>
                    <CardDescription>
                      Channel-wide moderation actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline">
                        <VolumeX className="h-4 w-4 mr-2" />
                        Mute Channel
                      </Button>
                      <Button variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite User
                      </Button>
                      <Button variant="outline" className="text-orange-600">
                        <UserX className="h-4 w-4 mr-2" />
                        Clear Users
                      </Button>
                      <Button variant="outline" className="text-red-600">
                        <Ban className="h-4 w-4 mr-2" />
                        Lock Channel
                      </Button>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button size="sm" variant="outline" className="w-full justify-start">
                          <Zap className="h-4 w-4 mr-2" />
                          Send Channel Notice
                        </Button>
                        <Button size="sm" variant="outline" className="w-full justify-start">
                          <Settings className="h-4 w-4 mr-2" />
                          Change Channel Modes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
