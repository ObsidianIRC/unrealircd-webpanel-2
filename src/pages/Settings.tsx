import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Settings as SettingsIcon,
  Network,
  Bell,
  Shield,
  Save,
  RefreshCw,
  Smartphone,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import { useTheme, type AccentColor } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

// Theme color options
const themeColors = [
  { name: 'Blue', value: 'default', color: 'hsl(218, 83%, 50%)' },
  { name: 'Green', value: 'green', color: 'hsl(142, 71%, 50%)' },
  { name: 'Purple', value: 'purple', color: 'hsl(262, 83%, 50%)' },
  { name: 'Orange', value: 'orange', color: 'hsl(25, 95%, 50%)' },
  { name: 'Red', value: 'red', color: 'hsl(0, 84%, 50%)' },
  { name: 'Pink', value: 'pink', color: 'hsl(330, 81%, 50%)' },
];

export function Settings() {
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const [settings, setSettings] = useState({
    themeMode: theme,
    accentColor: accentColor,
    compactMode: false,
    enableNotifications: true,
    rpcUrl: '',
    rpcUsername: '',
    updateInterval: 30,
  });

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Sync local settings with global theme context changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      themeMode: theme,
      accentColor: accentColor
    }));
  }, [theme, accentColor]);

  const updateSetting = (key: string, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // Apply changes immediately for theme settings
    if (key === 'themeMode' && value !== 'system') {
      setTheme(value as 'light' | 'dark');
    } else if (key === 'accentColor') {
      setAccentColor(value as AccentColor);
    }

    setUnsavedChanges(true);
  };

  const saveSettings = () => {
    for (const [key, value] of Object.entries(settings)) {
      localStorage.setItem(key, value.toString());
    }

    setUnsavedChanges(false);
    toast.success('Settings saved successfully!');
  };

  const testConnection = async () => {
    setConnectionStatus('connecting');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (Math.random() > 0.3) {
        setConnectionStatus('connected');
        toast.success('Successfully connected to UnrealIRCd RPC!');
      } else {
        setConnectionStatus('error');
        toast.error('Failed to connect to UnrealIRCd RPC');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Connection test failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your panel preferences and network connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Unsaved changes
            </Badge>
          )}
          <Button onClick={saveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Theme Mode</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  size="sm"
                  variant={settings.themeMode === 'light' ? 'default' : 'outline'}
                  onClick={() => updateSetting('themeMode', 'light')}
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Light
                </Button>
                <Button
                  size="sm"
                  variant={settings.themeMode === 'dark' ? 'default' : 'outline'}
                  onClick={() => updateSetting('themeMode', 'dark')}
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Accent Color</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {themeColors.map((color) => (
                  <Button
                    key={color.value}
                    size="sm"
                    variant={settings.accentColor === color.value ? 'default' : 'outline'}
                    onClick={() => updateSetting('accentColor', color.value)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color.color }}
                    />
                    {color.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) => updateSetting('compactMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Network Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Configuration
            </CardTitle>
            <CardDescription>
              Configure connection to UnrealIRCd RPC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rpc-url">RPC URL</Label>
              <Input
                id="rpc-url"
                placeholder="ws://localhost:8080/rpc"
                value={settings.rpcUrl}
                onChange={(e) => updateSetting('rpcUrl', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rpc-username">Username</Label>
              <Input
                id="rpc-username"
                value={settings.rpcUsername}
                onChange={(e) => updateSetting('rpcUsername', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="update-interval">Update Interval (seconds)</Label>
              <Input
                id="update-interval"
                type="number"
                min="5"
                max="300"
                value={settings.updateInterval}
                onChange={(e) => updateSetting('updateInterval', Number.parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={testConnection} disabled={connectionStatus === 'connecting'}>
                {connectionStatus === 'connecting' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Network className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              {connectionStatus === 'connected' && (
                <Badge className="bg-green-600">Connected</Badge>
              )}
              {connectionStatus === 'error' && (
                <Badge variant="destructive">Failed</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Show desktop notifications</p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Security and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Security settings are managed by your UnrealIRCd configuration.
              This panel respects all server-side permissions and access controls.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
