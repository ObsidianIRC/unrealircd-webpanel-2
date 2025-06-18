import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Logs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
        <p className="text-muted-foreground">
          View real-time server logs and events
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Log viewer interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
