# Modern UnrealIRCd Admin Panel

A modern, responsive administration panel for UnrealIRCd servers built with React, TypeScript, Tailwind CSS, and Go.

## 🚀 Features

### Frontend
- **Modern UI**: Built with React 18, TypeScript, and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Full theme switching support
- **Real-time Updates**: WebSocket integration for live network statistics
- **Component Library**: Using Shadcn/UI for consistent, accessible components

### Backend
- **Go API Server**: High-performance REST API built with Go
- **WebSocket Support**: Real-time data streaming to frontend
- **RPC Bridge**: Connects to UnrealIRCd via RPC (ready for integration)
- **CORS Enabled**: Proper cross-origin resource sharing configuration

### Network Management
- **Dashboard**: Real-time network overview with statistics and charts
- **User Management**: View and manage connected users
- **Channel Management**: Monitor IRC channels
- **Server Administration**: Manage server bans, operators, and settings
- **Plugin Management**: Install and configure plugins
- **Logs**: Real-time log viewing
- **Role Management**: User permissions and access control

## 📋 Requirements

### Frontend
- Node.js 18+ or Bun
- Modern web browser with ES2020 support

### Backend
- Go 1.21+
- UnrealIRCd 6.0+ with RPC module enabled

## 🛠️ Installation

### Frontend Development

1. Install dependencies:
```bash
cd unrealircd-admin-panel
bun install
```

2. Start the development server:
```bash
bun run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Development

1. Navigate to the backend directory:
```bash
cd backend
```

2. Initialize Go modules and download dependencies:
```bash
go mod tidy
```

3. Start the API server:
```bash
go run main.go
```

The API will be available at `http://localhost:8080`

## 🔐 Authentication

**Demo Credentials:**
- Username: `admin`
- Password: `admin`

In production, replace the mock authentication with your actual authentication system.

## 🏗️ Architecture

### Frontend Stack
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: High-quality React components
- **Recharts**: Beautiful, responsive charts
- **React Router**: Client-side routing
- **Sonner**: Toast notifications

### Backend Stack
- **Go**: High-performance backend language
- **Gorilla Mux**: HTTP router and URL matcher
- **Gorilla WebSocket**: WebSocket implementation
- **CORS**: Cross-origin resource sharing middleware

## 📁 Project Structure

```
unrealircd-admin-panel/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── layout/             # Layout components (header, sidebar)
│   │   └── ui/                 # Shadcn/UI components
│   ├── contexts/               # React contexts (auth, theme)
│   ├── hooks/                  # Custom React hooks
│   ├── pages/                  # Application pages
│   └── lib/                    # Utility functions
├── backend/                     # Go backend
│   ├── main.go                 # Main server file
│   └── go.mod                  # Go module definition
├── public/                     # Static assets
└── .same/                      # Development tracking
```

## 🔌 API Endpoints

### Network Information
- `GET /api/network/stats` - Network statistics
- `GET /api/network/health` - Network health status

### User Management
- `GET /api/users` - List connected users

### Real-time Updates
- `WS /ws` - WebSocket connection for live updates

## 🎨 Design Features

- **Modern Interface**: Clean, professional design inspired by modern admin dashboards
- **Data Visualization**: Interactive charts for network traffic and statistics
- **Responsive Layout**: Adaptive design that works on all screen sizes
- **Accessibility**: WCAG compliant components with proper ARIA labels
- **Theme Support**: Light and dark mode with system preference detection

## 🔄 Real-time Features

- Live network statistics updates
- Real-time user connection/disconnection notifications
- Server status monitoring
- Activity feed with recent events

## 🛡️ Security Features

- JWT-based authentication (ready for implementation)
- Role-based access control
- CORS protection
- Input validation and sanitization

## 🚀 Deployment

### Frontend (Static Build)
```bash
bun run build
```

Deploy the `dist/` folder to your web server or CDN.

### Backend (Production)
```bash
cd backend
go build -o unrealircd-admin-panel main.go
./unrealircd-admin-panel
```

## 📈 Future Enhancements

- [ ] Full UnrealIRCd RPC integration
- [ ] Advanced user actions (kick, ban, etc.)
- [ ] Channel management interface
- [ ] Server ban management with filters
- [ ] Plugin marketplace
- [ ] Configuration file editor
- [ ] Audit logging
- [ ] Multi-server support
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Check the UnrealIRCd documentation
- Join the UnrealIRCd community

## 🙏 Acknowledgments

- Original UnrealIRCd WebPanel team
- Shadcn for the excellent UI components
- The React and Go communities
