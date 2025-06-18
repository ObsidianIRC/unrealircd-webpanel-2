import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Plugins() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Plugins</h1>
        <p className="text-muted-foreground">
          Manage installed plugins and add new ones
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plugin Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Plugin management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
