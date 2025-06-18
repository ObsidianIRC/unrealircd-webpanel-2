# UnrealIRCd Admin Panel - Go Backend

A high-performance Go backend that provides a REST API and WebSocket interface for the modern UnrealIRCd Admin Panel.

## Features

- **UnrealIRCd RPC Integration**: Full JSON-RPC over WebSocket support
- **REST API**: Comprehensive endpoints for network management
- **Real-time Updates**: WebSocket streaming for live data
- **Automatic Fallback**: Falls back to mock data when RPC is unavailable
- **CORS Support**: Configured for frontend development
- **Configuration**: Environment-based configuration

## Prerequisites

- Go 1.21 or higher
- UnrealIRCd 6.0+ with RPC module enabled
- Network access to UnrealIRCd RPC endpoint

## Installation

1. **Clone and navigate to backend directory:**
```bash
cd unrealircd-admin-panel/backend
```

2. **Install dependencies:**
```bash
go mod tidy
```

3. **Build the application:**
```bash
go build -o unrealircd-admin-panel main.go
```

## Configuration

The backend is configured using environment variables:

### Required Configuration

```bash
# UnrealIRCd RPC Configuration
UNREAL_RPC_URL="ws://your-server:8080/rpc"
UNREAL_RPC_USERNAME="your-rpc-username"
UNREAL_RPC_PASSWORD="your-rpc-password"

# Server Configuration
PORT="8080"

# Feature Flags
USE_MOCK_DATA="false"  # Set to true to force mock data mode
```

### Example Configuration

Create a `.env` file or set environment variables:

```bash
# Development setup
export UNREAL_RPC_URL="ws://localhost:8080/rpc"
export UNREAL_RPC_USERNAME="admin"
export UNREAL_RPC_PASSWORD="secretpassword"
export PORT="8080"
export USE_MOCK_DATA="false"
```

## UnrealIRCd Configuration

### 1. Enable RPC Module

Add to your `unrealircd.conf`:

```
// Load the RPC module
loadmodule "rpc";

// Configure RPC
rpc {
    // Listen on this port for RPC connections
    listen {
        ip *;
        port 8080;
    };

    // Authentication required
    require-auth yes;
};

// Create an RPC user
rpc-user admin {
    password "secretpassword";
    mask *;
    permissions {
        // Grant necessary permissions
        "user.*";
        "channel.*";
        "server_ban.*";
        "server_info.*";
    };
};
```

### 2. Restart UnrealIRCd

```bash
./unrealircd restart
```

### 3. Test RPC Connection

You can test the RPC connection manually:

```bash
# Test if RPC is accessible
curl -H "Upgrade: websocket" -H "Connection: Upgrade" \
     -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" \
     ws://localhost:8080/rpc
```

## Running the Backend

### Development Mode

```bash
# With environment variables
UNREAL_RPC_URL="ws://localhost:8080/rpc" \
UNREAL_RPC_USERNAME="admin" \
UNREAL_RPC_PASSWORD="secretpassword" \
go run main.go
```

### Production Mode

```bash
# Build and run
go build -o unrealircd-admin-panel main.go
./unrealircd-admin-panel
```

### Docker (Optional)

```bash
# Build Docker image
docker build -t unrealircd-admin-panel .

# Run with environment variables
docker run -p 8080:8080 \
  -e UNREAL_RPC_URL="ws://host.docker.internal:8080/rpc" \
  -e UNREAL_RPC_USERNAME="admin" \
  -e UNREAL_RPC_PASSWORD="secretpassword" \
  unrealircd-admin-panel
```

## API Endpoints

### Network Information

- `GET /api/network/stats` - Network statistics
- `GET /api/network/health` - Network health status

### User Management

- `GET /api/users` - List connected users

### Channel Management

- `GET /api/channels` - List channels
- `GET /api/channels/{channel}/users` - Get users in specific channel
- `POST /api/channels/kick` - Kick user from channel
- `POST /api/channels/ban` - Ban user from channel

### Real-time Updates

- `WS /ws` - WebSocket for live updates

### Health Check

- `GET /health` - Service health status

## Mock Data Mode

When UnrealIRCd RPC is not available or configured, the backend automatically falls back to mock data mode. This is useful for:

- Development without UnrealIRCd
- Testing the frontend
- Demonstration purposes

Force mock data mode:

```bash
USE_MOCK_DATA="true" go run main.go
```

## API Response Examples

### Network Stats

```json
{
  "usersOnline": 42,
  "channels": 15,
  "servers": 3,
  "operators": 5,
  "serverBans": 12,
  "spamfilters": 3,
  "serverBanExceptions": 2,
  "servicesOnline": "2/2",
  "panelAccounts": 8,
  "plugins": 6
}
```

### Users List

```json
[
  {
    "nick": "User123",
    "country": "US",
    "hostIP": "user.example.com (192.168.1.100)",
    "account": "registered_user",
    "oper": "O",
    "connectedTo": "irc.example.com",
    "reputation": 100,
    "modes": "+ix",
    "connectTime": "2h ago"
  }
]
```

### Channel Information

```json
[
  {
    "name": "#general",
    "users": 25,
    "modes": "+nt",
    "topic": "Welcome to the general discussion",
    "created": "2024-06-09 15:42:18",
    "userList": [
      {
        "nick": "User123",
        "modes": ["v"],
        "joined": 1704067200
      }
    ]
  }
]
```

## WebSocket Real-time Updates

The WebSocket endpoint provides real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'networkStats':
      updateNetworkStats(data.data);
      break;
    case 'userJoin':
      handleUserJoin(data.data);
      break;
    case 'userLeave':
      handleUserLeave(data.data);
      break;
  }
};
```

## Error Handling

The backend handles various error scenarios:

1. **RPC Connection Failed**: Falls back to mock data
2. **Authentication Failed**: Returns 401 with error message
3. **Invalid Requests**: Returns 400 with validation errors
4. **RPC Timeout**: Returns 408 with timeout message
5. **Server Errors**: Returns 500 with error details

## Security Considerations

1. **Authentication**: All RPC calls require valid credentials
2. **CORS**: Configured for development, adjust for production
3. **Input Validation**: All user inputs are validated
4. **Rate Limiting**: Consider adding rate limiting for production
5. **TLS**: Use HTTPS/WSS in production

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "rpc_connected": true,
  "mock_data": false
}
```

### Logs

The backend provides structured logging:

```
2024/06/16 15:30:00 🚀 UnrealIRCd Admin Panel API server starting on port 8080
2024/06/16 15:30:00 📊 API endpoints available at http://localhost:8080/api
2024/06/16 15:30:00 🔌 WebSocket endpoint at ws://localhost:8080/ws
2024/06/16 15:30:01 🔗 Connected to UnrealIRCd RPC at ws://localhost:8080/rpc
```

## Troubleshooting

### Common Issues

1. **RPC Connection Failed**
   - Check UnrealIRCd RPC module is loaded
   - Verify RPC URL, username, and password
   - Check firewall settings

2. **WebSocket Connection Issues**
   - Ensure CORS settings allow your frontend domain
   - Check if WebSocket is properly upgraded

3. **Permission Denied**
   - Verify RPC user has required permissions
   - Check UnrealIRCd logs for authentication errors

### Debug Mode

Enable verbose logging:

```bash
DEBUG=1 go run main.go
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

This project is licensed under the GPL-3.0 License.
