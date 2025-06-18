import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ServerBans() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Server Bans Overview</h1>
        <p className="text-muted-foreground">
          Manage network bans, K-Lines, G-Lines, and more
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Server Ban Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Server ban management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
