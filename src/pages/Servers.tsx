import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Servers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Servers</h1>
        <p className="text-muted-foreground">
          Manage IRC servers in your network
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Server Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Server management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
