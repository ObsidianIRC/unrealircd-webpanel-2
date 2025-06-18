import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Hash,
  Server,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock data - in real app this would come from API
const networkStats = {
  usersOnline: 1,
  channels: 21,
  servers: 1,
  operators: 1,
  serverBans: 9,
  spamfilters: 0,
  serverBanExceptions: 4,
  servicesOnline: '0/0',
  panelAccounts: 1,
  plugins: 3,
};

const networkHealth = {
  status: 'Perfect',
  problems: 0,
  uptime: '7d 14h 32m',
  lastRestart: '2024-06-09 15:42:18',
};

const recentActivity = [
  { time: '2 min ago', action: 'User Guest0 connected from localhost', type: 'info' },
  { time: '5 min ago', action: 'Server ban added for *@206.168.34.*', type: 'warning' },
  { time: '10 min ago', action: 'Plugin FileDB loaded successfully', type: 'success' },
  { time: '15 min ago', action: 'Channel #general created', type: 'info' },
];

const trafficData = [
  { time: '00:00', users: 45, channels: 18 },
  { time: '04:00', users: 32, channels: 15 },
  { time: '08:00', users: 67, channels: 22 },
  { time: '12:00', users: 89, channels: 28 },
  { time: '16:00', users: 156, channels: 35 },
  { time: '20:00', users: 134, channels: 31 },
];

export function Dashboard() {
  const [isLive, setIsLive] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Overview</h1>
          <p className="text-muted-foreground">
            Real-time statistics and monitoring for your IRC network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={networkHealth.status === 'Perfect' ? 'default' : 'destructive'}
            className="gap-1"
          >
            {networkHealth.status === 'Perfect' ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {networkHealth.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            {isLive ? 'Live' : 'Paused'}
          </Button>
        </div>
      </div>

      {/* Network Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            <CardTitle>Network Health</CardTitle>
          </div>
          <CardDescription>
            Found {networkHealth.problems} problems in total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Uptime</p>
                <p className="text-2xl font-bold">{networkHealth.uptime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-2xl font-bold text-green-600">{networkHealth.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Restart</p>
                <p className="text-sm text-muted-foreground">{networkHealth.lastRestart}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{networkStats.usersOnline}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +20% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Channels</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{networkStats.channels}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{networkStats.operators}</div>
            <p className="text-xs text-muted-foreground">Active moderators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{networkStats.servers}</div>
            <p className="text-xs text-muted-foreground">Network nodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Network Traffic</CardTitle>
            <CardDescription>
              User and channel activity over the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Users"
                />
                <Line
                  type="monotone"
                  dataKey="channels"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Channels"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events and actions on your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={`activity-${activity.time}-${activity.action.substring(0, 20)}`} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                    activity.type === 'error' ? 'bg-red-dynamic' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                    <p className="text-sm font-medium">{activity.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Server Bans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-dynamic">{networkStats.serverBans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Spamfilter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{networkStats.spamfilters}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Services Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{networkStats.servicesOnline}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Plugins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{networkStats.plugins}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
