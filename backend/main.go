package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"unrealircd-admin-panel/rpc"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/cors"
	"golang.org/x/crypto/bcrypt"
)

// Configuration for the server
type Config struct {
	Port              string `json:"port"`
	UnrealRPCURL      string `json:"unreal_rpc_url"`
	UnrealRPCUsername string `json:"unreal_rpc_username"`
	UnrealRPCPassword string `json:"unreal_rpc_password"`
	UseMockData       bool   `json:"use_mock_data"`
	JWTSecret         string `json:"jwt_secret"`
}

// Global variables
var (
	config    *Config
	rpcClient *rpc.RPCClient
	db        *sql.DB
)

// WebpanelUser represents a webpanel user account
type WebpanelUser struct {
	ID           int        `json:"id"`
	Username     string     `json:"username"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Role         string     `json:"role"`
	Permissions  string     `json:"permissions"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	LastLogin    *time.Time `json:"last_login"`
	Active       bool       `json:"active"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	Success bool          `json:"success"`
	User    *WebpanelUser `json:"user,omitempty"`
	Token   string        `json:"token,omitempty"`
	Error   string        `json:"error,omitempty"`
}

// NetworkStats represents the current network statistics
type NetworkStats struct {
	UsersOnline         int    `json:"usersOnline"`
	Channels            int    `json:"channels"`
	Servers             int    `json:"servers"`
	Operators           int    `json:"operators"`
	ServerBans          int    `json:"serverBans"`
	Spamfilters         int    `json:"spamfilters"`
	ServerBanExceptions int    `json:"serverBanExceptions"`
	ServicesOnline      string `json:"servicesOnline"`
	PanelAccounts       int    `json:"panelAccounts"`
	Plugins             int    `json:"plugins"`
}

// NetworkHealth represents the network health status
type NetworkHealth struct {
	Status      string `json:"status"`
	Problems    int    `json:"problems"`
	Uptime      string `json:"uptime"`
	LastRestart string `json:"lastRestart"`
}

// User represents an IRC user for API responses
type User struct {
	Nick        string `json:"nick"`
	Country     string `json:"country"`
	HostIP      string `json:"hostIP"`
	Account     string `json:"account"`
	Oper        string `json:"oper"`
	ConnectedTo string `json:"connectedTo"`
	Reputation  int    `json:"reputation"`
	Modes       string `json:"modes"`
	ConnectTime string `json:"connectTime"`
}

// Role represents a user role with permissions
type Role struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
	CreatedAt   string   `json:"created_at"`
	UpdatedAt   string   `json:"updated_at"`
}

// Permission represents a permission that can be assigned to roles
type Permission struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

// Channel represents a channel for API responses
type Channel struct {
	Name     string            `json:"name"`
	Users    int               `json:"users"`
	Modes    string            `json:"modes"`
	Topic    string            `json:"topic"`
	Created  string            `json:"created"`
	UserList []rpc.ChannelUser `json:"userList,omitempty"`
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for development
		return true
	},
}

// loadConfig loads configuration from environment variables
func loadConfig() *Config {
	return &Config{
		Port:              getEnv("PORT", "8080"),
		UnrealRPCURL:      getEnv("UNREAL_RPC_URL", ""),
		UnrealRPCUsername: getEnv("UNREAL_RPC_USERNAME", ""),
		UnrealRPCPassword: getEnv("UNREAL_RPC_PASSWORD", ""),
		UseMockData:       getEnvBool("USE_MOCK_DATA", true),
		JWTSecret:         getEnv("JWT_SECRET", "default-secret-change-me"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

// Initialize database
func initDatabase() error {
	var err error
	db, err = sql.Open("sqlite3", "./data/webpanel.db")
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Create data directory if it doesn't exist
	if err := os.MkdirAll("./data", 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}

	// Create users table
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS webpanel_users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'user',
		permissions TEXT DEFAULT '[]',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_login DATETIME NULL,
		active BOOLEAN DEFAULT 1
	);`

	if _, err := db.Exec(createUsersTable); err != nil {
		return fmt.Errorf("failed to create users table: %w", err)
	}

	// Create default admin user if no users exist
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM webpanel_users").Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check user count: %w", err)
	}

	if count == 0 {
		// Create default admin user
		if err := createDefaultAdmin(); err != nil {
			return fmt.Errorf("failed to create default admin: %w", err)
		}
		log.Println("Created default admin user: admin/admin")
	}

	return nil
}

// Create default admin user
func createDefaultAdmin() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		INSERT INTO webpanel_users (username, email, password_hash, role, permissions, active)
		VALUES (?, ?, ?, ?, ?, ?)
	`, "admin", "admin@localhost", string(hashedPassword), "admin", `["*"]`, true)

	return err
}

// authenticateUser validates user credentials
func authenticateUser(username, password string) (*WebpanelUser, error) {
	var user WebpanelUser
	var passwordHash string

	err := db.QueryRow(`
		SELECT id, username, email, password_hash, role, permissions, created_at, updated_at, last_login, active
		FROM webpanel_users
		WHERE username = ? AND active = 1
	`, username).Scan(
		&user.ID, &user.Username, &user.Email, &passwordHash,
		&user.Role, &user.Permissions, &user.CreatedAt, &user.UpdatedAt,
		&user.LastLogin, &user.Active,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("invalid credentials")
		}
		return nil, err
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Update last login
	now := time.Now()
	_, err = db.Exec("UPDATE webpanel_users SET last_login = ? WHERE id = ?", now, user.ID)
	if err != nil {
		log.Printf("Failed to update last login: %v", err)
	}
	user.LastLogin = &now

	return &user, nil
}

// Initialize RPC client if configuration is available
func initRPCClient() {
	log.Printf("🔧 Initializing RPC client...")
	log.Printf("   RPC URL: %s", config.UnrealRPCURL)
	log.Printf("   Username: %s", config.UnrealRPCUsername)
	log.Printf("   Use Mock Data: %t", config.UseMockData)

	if config.UnrealRPCURL != "" && config.UnrealRPCUsername != "" && !config.UseMockData {
		log.Printf("🚀 Creating RPC client with real connection...")
		rpcClient = rpc.NewRPCClient(config.UnrealRPCURL, config.UnrealRPCUsername, config.UnrealRPCPassword)

		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()

		log.Printf("⏰ Attempting connection with 15 second timeout...")
		if err := rpcClient.Connect(ctx); err != nil {
			log.Printf("❌ Failed to connect to UnrealIRCd RPC: %v", err)
			log.Printf("🔄 Falling back to mock data mode")
			rpcClient = nil
			config.UseMockData = true
		} else {
			log.Printf("✅ RPC client connected successfully!")

			// Send startup log message to UnrealIRCd
			log.Printf("📝 Sending startup log message to UnrealIRCd...")
			if err := rpcClient.SendCopilotLog(ctx); err != nil {
				log.Printf("⚠️ Failed to send startup log message: %v", err)
			} else {
				log.Printf("🎉 Startup log message sent successfully: 'Co-pilot is the best'")
			}
		}
	} else {
		log.Printf("ℹ️  RPC not configured or mock data forced, using mock mode")
		log.Printf("   Missing URL: %t", config.UnrealRPCURL == "")
		log.Printf("   Missing Username: %t", config.UnrealRPCUsername == "")
		log.Printf("   Force Mock: %t", config.UseMockData)
		config.UseMockData = true
	}
}

// Mock data functions (fallback when RPC is not available)
func getMockNetworkStats() NetworkStats {
	return NetworkStats{
		UsersOnline:         1,
		Channels:            21,
		Servers:             1,
		Operators:           1,
		ServerBans:          9,
		Spamfilters:         0,
		ServerBanExceptions: 4,
		ServicesOnline:      "0/0",
		PanelAccounts:       1,
		Plugins:             3,
	}
}

func getMockNetworkHealth() NetworkHealth {
	return NetworkHealth{
		Status:      "Perfect",
		Problems:    0,
		Uptime:      "7d 14h 32m",
		LastRestart: "2024-06-09 15:42:18",
	}
}

func getMockUsers() []User {
	return []User{
		{
			Nick:        "Guest0",
			Country:     "",
			HostIP:      "localhost (127.0.0.1)",
			Account:     "Valware",
			Oper:        "V",
			ConnectedTo: "irc.valware.uk",
			Reputation:  0,
			Modes:       "+i",
			ConnectTime: "2 min ago",
		},
	}
}

func getMockChannels() []Channel {
	return []Channel{
		{
			Name:    "#general",
			Users:   5,
			Modes:   "+nt",
			Topic:   "Welcome to the general discussion channel",
			Created: "2024-06-09 15:42:18",
		},
		{
			Name:    "#help",
			Users:   2,
			Modes:   "+nt",
			Topic:   "Get help and support here",
			Created: "2024-06-09 16:00:00",
		},
	}
}

// JWT secret key - in production, use environment variable
var jwtSecret = []byte("your-secret-key") // Change this in production!

// JWTClaims represents JWT token claims
type JWTClaims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// generateJWT creates a JWT token for the user
func generateJWT(user *WebpanelUser) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   fmt.Sprintf("%d", user.ID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// validateJWT validates and parses a JWT token
func validateJWT(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// authMiddleware validates JWT tokens and protects API endpoints
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Check for Bearer token format
		const bearerPrefix = "Bearer "
		if !strings.HasPrefix(authHeader, bearerPrefix) {
			http.Error(w, "Invalid authorization format. Use: Bearer <token>", http.StatusUnauthorized)
			return
		}

		tokenString := authHeader[len(bearerPrefix):]

		// Validate the JWT token
		claims, err := validateJWT(tokenString)
		if err != nil {
			log.Printf("JWT validation failed: %v", err)
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Add user info to request context for use in handlers
		ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
		ctx = context.WithValue(ctx, "username", claims.Username)
		ctx = context.WithValue(ctx, "role", claims.Role)

		// Continue to the next handler
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// getUserFromContext extracts user info from request context
func getUserFromContext(r *http.Request) (int, string, string) {
	userID, _ := r.Context().Value("user_id").(int)
	username, _ := r.Context().Value("username").(string)
	role, _ := r.Context().Value("role").(string)
	return userID, username, role
}

// requireRole middleware to check user roles
func requireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _, role := getUserFromContext(r)

			// Check if user has required role
			for _, allowedRole := range allowedRoles {
				if role == allowedRole || role == "admin" { // Admin can access everything
					next.ServeHTTP(w, r)
					return
				}
			}

			http.Error(w, "Insufficient permissions", http.StatusForbidden)
		})
	}
}

// API Handlers with RPC integration
func getNetworkStatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if config.UseMockData || rpcClient == nil {
		stats := getMockNetworkStats()
		json.NewEncoder(w).Encode(stats)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	networkInfo, err := rpcClient.GetNetworkInfo(ctx)
	if err != nil {
		log.Printf("RPC error getting network stats: %v", err)
		// Fallback to mock data
		stats := getMockNetworkStats()
		json.NewEncoder(w).Encode(stats)
		return
	}

	// Convert RPC response to API format
	stats := NetworkStats{
		UsersOnline: networkInfo.UsersOnline,
		Channels:    networkInfo.Channels,
		Servers:     networkInfo.Servers,
		Operators:   networkInfo.Operators,
		// These would need additional RPC calls or different endpoints
		ServerBans:          9,     // placeholder
		Spamfilters:         0,     // placeholder
		ServerBanExceptions: 4,     // placeholder
		ServicesOnline:      "0/0", // placeholder
		PanelAccounts:       1,     // placeholder
		Plugins:             3,     // placeholder
	}

	json.NewEncoder(w).Encode(stats)
}

func getNetworkHealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if config.UseMockData || rpcClient == nil {
		health := getMockNetworkHealth()
		json.NewEncoder(w).Encode(health)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	networkInfo, err := rpcClient.GetNetworkInfo(ctx)
	if err != nil {
		log.Printf("RPC error getting network health: %v", err)
		health := getMockNetworkHealth()
		json.NewEncoder(w).Encode(health)
		return
	}

	// Convert uptime to human readable format
	uptime := time.Duration(networkInfo.Uptime) * time.Second
	uptimeStr := fmt.Sprintf("%dd %dh %dm",
		int(uptime.Hours()/24),
		int(uptime.Hours())%24,
		int(uptime.Minutes())%60)

	health := NetworkHealth{
		Status:      "Perfect",
		Problems:    0,
		Uptime:      uptimeStr,
		LastRestart: time.Now().Add(-uptime).Format("2006-01-02 15:04:05"),
	}

	json.NewEncoder(w).Encode(health)
}

func getUsersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if config.UseMockData || rpcClient == nil {
		users := getMockUsers()
		json.NewEncoder(w).Encode(users)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rpcUsers, err := rpcClient.GetUsers(ctx)
	if err != nil {
		log.Printf("RPC error getting users: %v", err)
		users := getMockUsers()
		json.NewEncoder(w).Encode(users)
		return
	}

	// Convert RPC users to API format
	users := make([]User, len(rpcUsers))
	for i, rpcUser := range rpcUsers {
		connectTime := time.Unix(rpcUser.ConnectTime, 0)
		timeSince := time.Since(connectTime)

		var timeStr string
		if timeSince.Hours() >= 1 {
			timeStr = fmt.Sprintf("%.0fh ago", timeSince.Hours())
		} else {
			timeStr = fmt.Sprintf("%.0fm ago", timeSince.Minutes())
		}

		operClass := ""
		if rpcUser.IsOper {
			operClass = rpcUser.OperClass
			if operClass == "" {
				operClass = "O"
			}
		}

		users[i] = User{
			Nick:        rpcUser.Nick,
			Country:     rpcUser.Country,
			HostIP:      fmt.Sprintf("%s (%s)", rpcUser.Hostname, rpcUser.IP),
			Account:     rpcUser.Account,
			Oper:        operClass,
			ConnectedTo: rpcUser.Server,
			Reputation:  0, // Not available in RPC
			Modes:       fmt.Sprintf("+%s", joinStrings(rpcUser.Modes)),
			ConnectTime: timeStr,
		}
	}

	json.NewEncoder(w).Encode(users)
}

func getChannelsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if config.UseMockData || rpcClient == nil {
		channels := getMockChannels()
		json.NewEncoder(w).Encode(channels)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rpcChannels, err := rpcClient.GetChannels(ctx)
	if err != nil {
		log.Printf("RPC error getting channels: %v", err)
		channels := getMockChannels()
		json.NewEncoder(w).Encode(channels)
		return
	}

	// Convert RPC channels to API format
	channels := make([]Channel, len(rpcChannels))
	for i, rpcChannel := range rpcChannels {
		// Parse the ISO timestamp string (not Unix timestamp)
		creationTime := parseRPCTimestamp(rpcChannel.CreationTime)

		// Parse modes string directly (it's already a string, not []string)
		modeStr := parseModeString(rpcChannel.Modes)

		channels[i] = Channel{
			Name:     rpcChannel.Name,
			Users:    rpcChannel.UserCount,
			Modes:    modeStr,
			Topic:    rpcChannel.Topic,
			Created:  creationTime.Format("2006-01-02 15:04:05"),
			UserList: rpcChannel.Users,
		}
	}

	json.NewEncoder(w).Encode(channels)
}

// Helper function to parse RPC timestamps
func parseRPCTimestamp(isoTime string) time.Time {
	if isoTime == "" {
		return time.Time{}
	}

	t, err := time.Parse("2006-01-02T15:04:05.000Z", isoTime)
	if err != nil {
		log.Printf("⚠️ Failed to parse timestamp %s: %v", isoTime, err)
		return time.Time{}
	}

	return t
}

// Helper function to parse mode strings from UnrealIRCd
func parseModeString(modes string) string {
	if modes == "" {
		return ""
	}

	// UnrealIRCd returns modes like "ntCHP 50:30d"
	// We want to extract just the mode letters part
	parts := strings.Fields(modes)
	if len(parts) == 0 {
		return ""
	}

	// Return the first part with a + prefix
	return "+" + parts[0]
}

func getChannelUsersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	channelName := vars["channel"]

	if channelName == "" {
		http.Error(w, "Channel name required", http.StatusBadRequest)
		return
	}

	if config.UseMockData || rpcClient == nil {
		// Return mock channel users
		users := []rpc.ChannelUser{
			{Nick: "Guest0", Modes: []string{"v"}, Joined: time.Now().Unix() - 3600},
			{Nick: "Admin", Modes: []string{"o"}, Joined: time.Now().Unix() - 7200},
		}
		json.NewEncoder(w).Encode(users)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	users, err := rpcClient.GetChannelUsers(ctx, channelName)
	if err != nil {
		log.Printf("RPC error getting channel users: %v", err)
		http.Error(w, "Failed to get channel users", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(users)
}

// Channel moderation handlers
func kickUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Channel string `json:"channel"`
		Nick    string `json:"nick"`
		Reason  string `json:"reason"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if config.UseMockData || rpcClient == nil {
		// Mock success response
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	err := rpcClient.KickUser(ctx, req.Channel, req.Nick, req.Reason)
	if err != nil {
		log.Printf("RPC error kicking user: %v", err)
		http.Error(w, "Failed to kick user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func banUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Channel string `json:"channel"`
		Mask    string `json:"mask"`
		Reason  string `json:"reason"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if config.UseMockData || rpcClient == nil {
		// Mock success response
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	err := rpcClient.BanUser(ctx, req.Channel, req.Mask, req.Reason)
	if err != nil {
		log.Printf("RPC error banning user: %v", err)
		http.Error(w, "Failed to ban user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// SearchResult represents a search result item
type SearchResult struct {
	Type        string      `json:"type"`        // "user", "channel", "server"
	Name        string      `json:"name"`        // nick, channel name, server name
	Description string      `json:"description"` // additional info
	Data        interface{} `json:"data"`        // full object data
}

// SearchResponse represents the search API response
type SearchResponse struct {
	Query   string         `json:"query"`
	Results []SearchResult `json:"results"`
	Total   int            `json:"total"`
}

// searchHandler handles search requests across users, channels, and servers
func searchHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Search query is required", http.StatusBadRequest)
		return
	}

	var results []SearchResult

	if config.UseMockData || rpcClient == nil {
		// Mock search results
		results = getMockSearchResults(query)
	} else {
		// Real search using RPC
		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		results = getSearchResults(ctx, query)
	}

	response := SearchResponse{
		Query:   query,
		Results: results,
		Total:   len(results),
	}

	json.NewEncoder(w).Encode(response)
}

// getMockSearchResults returns mock search results for development
func getMockSearchResults(query string) []SearchResult {
	var results []SearchResult

	// Mock users
	users := getMockUsers()
	for _, user := range users {
		if matchesSearchQuery(user.Nick, query) || matchesSearchQuery(user.Account, query) {
			results = append(results, SearchResult{
				Type:        "user",
				Name:        user.Nick,
				Description: fmt.Sprintf("Account: %s, Connected to: %s", user.Account, user.ConnectedTo),
				Data:        user,
			})
		}
	}

	// Mock channels
	channels := getMockChannels()
	for _, channel := range channels {
		if matchesSearchQuery(channel.Name, query) || matchesSearchQuery(channel.Topic, query) {
			results = append(results, SearchResult{
				Type:        "channel",
				Name:        channel.Name,
				Description: fmt.Sprintf("%d users - %s", channel.Users, channel.Topic),
				Data:        channel,
			})
		}
	}

	return results
}

// getMockRoles returns mock roles for development
func getMockRoles() []Role {
	return []Role{
		{
			ID:          1,
			Name:        "admin",
			Description: "Full administrative access",
			Permissions: []string{"*"},
			CreatedAt:   "2024-06-01 10:00:00",
			UpdatedAt:   "2024-06-01 10:00:00",
		},
		{
			ID:          2,
			Name:        "moderator",
			Description: "Channel moderation and user management",
			Permissions: []string{"channels.view", "channels.moderate", "users.view", "users.kick", "users.ban"},
			CreatedAt:   "2024-06-01 10:00:00",
			UpdatedAt:   "2024-06-01 10:00:00",
		},
		{
			ID:          3,
			Name:        "operator",
			Description: "Server operations and advanced features",
			Permissions: []string{"channels.view", "users.view", "server.view", "server.manage", "bans.manage"},
			CreatedAt:   "2024-06-01 10:00:00",
			UpdatedAt:   "2024-06-01 10:00:00",
		},
		{
			ID:          4,
			Name:        "viewer",
			Description: "Read-only access to most features",
			Permissions: []string{"channels.view", "users.view", "server.view", "logs.view"},
			CreatedAt:   "2024-06-01 10:00:00",
			UpdatedAt:   "2024-06-01 10:00:00",
		},
	}
}

// getMockPermissions returns mock permissions for development
func getMockPermissions() []Permission {
	return []Permission{
		{ID: "*", Name: "All Permissions", Description: "Full administrative access to all features", Category: "admin"},
		{ID: "channels.view", Name: "View Channels", Description: "View channel list and information", Category: "channels"},
		{ID: "channels.moderate", Name: "Moderate Channels", Description: "Moderate channels (kick, ban, topic)", Category: "channels"},
		{ID: "channels.manage", Name: "Manage Channels", Description: "Create, delete, and configure channels", Category: "channels"},
		{ID: "users.view", Name: "View Users", Description: "View user list and information", Category: "users"},
		{ID: "users.kick", Name: "Kick Users", Description: "Kick users from channels", Category: "users"},
		{ID: "users.ban", Name: "Ban Users", Description: "Ban users from channels or server", Category: "users"},
		{ID: "users.manage", Name: "Manage Users", Description: "Full user management including accounts", Category: "users"},
		{ID: "server.view", Name: "View Server", Description: "View server information and statistics", Category: "server"},
		{ID: "server.manage", Name: "Manage Server", Description: "Server configuration and management", Category: "server"},
		{ID: "bans.view", Name: "View Bans", Description: "View server bans and exceptions", Category: "moderation"},
		{ID: "bans.manage", Name: "Manage Bans", Description: "Create, modify, and remove bans", Category: "moderation"},
		{ID: "logs.view", Name: "View Logs", Description: "Access to server logs", Category: "monitoring"},
		{ID: "logs.manage", Name: "Manage Logs", Description: "Configure logging settings", Category: "monitoring"},
		{ID: "panel.users", Name: "Panel Users", Description: "Manage web panel user accounts", Category: "panel"},
		{ID: "panel.settings", Name: "Panel Settings", Description: "Configure web panel settings", Category: "panel"},
	}
}

// getSearchResults performs real search using RPC
func getSearchResults(ctx context.Context, query string) []SearchResult {
	var results []SearchResult

	// Search users
	if rpcUsers, err := rpcClient.GetUsers(ctx); err == nil {
		for _, rpcUser := range rpcUsers {
			if matchesSearchQuery(rpcUser.Nick, query) ||
				matchesSearchQuery(rpcUser.Account, query) ||
				matchesSearchQuery(rpcUser.Realname, query) {

				connectTime := time.Unix(rpcUser.ConnectTime, 0)
				timeSince := time.Since(connectTime)
				var timeStr string
				if timeSince.Hours() >= 1 {
					timeStr = fmt.Sprintf("%.0fh ago", timeSince.Hours())
				} else {
					timeStr = fmt.Sprintf("%.0fm ago", timeSince.Minutes())
				}

				user := User{
					Nick:        rpcUser.Nick,
					Country:     rpcUser.Country,
					HostIP:      fmt.Sprintf("%s (%s)", rpcUser.Hostname, rpcUser.IP),
					Account:     rpcUser.Account,
					Oper:        getOperClass(rpcUser),
					ConnectedTo: rpcUser.Server,
					Reputation:  0,
					Modes:       fmt.Sprintf("+%s", joinStrings(rpcUser.Modes)),
					ConnectTime: timeStr,
				}

				results = append(results, SearchResult{
					Type:        "user",
					Name:        rpcUser.Nick,
					Description: fmt.Sprintf("Account: %s, Connected to: %s", rpcUser.Account, rpcUser.Server),
					Data:        user,
				})
			}
		}
	}

	// Search channels - Fix the modes handling here too
	if rpcChannels, err := rpcClient.GetChannels(ctx); err == nil {
		for _, rpcChannel := range rpcChannels {
			if matchesSearchQuery(rpcChannel.Name, query) ||
				matchesSearchQuery(rpcChannel.Topic, query) {

				// Parse the ISO timestamp string
				createdTime := parseRPCTimestamp(rpcChannel.CreationTime)

				channel := Channel{
					Name:     rpcChannel.Name,
					Users:    rpcChannel.UserCount,
					Modes:    parseModeString(rpcChannel.Modes), // Use parseModeString instead of joinStrings
					Topic:    rpcChannel.Topic,
					Created:  createdTime.Format("2006-01-02 15:04:05"),
					UserList: rpcChannel.Users,
				}

				results = append(results, SearchResult{
					Type:        "channel",
					Name:        rpcChannel.Name,
					Description: fmt.Sprintf("%d users - %s", rpcChannel.UserCount, rpcChannel.Topic),
					Data:        channel,
				})
			}
		}
	}

	return results
}

// matchesSearchQuery checks if a string matches the search query with wildcard support
func matchesSearchQuery(text, query string) bool {
	if query == "" {
		return true
	}

	// Convert to lowercase for case-insensitive search
	text = strings.ToLower(text)
	query = strings.ToLower(query)

	// Simple wildcard support with asterisk
	if strings.Contains(query, "*") {
		// Split on asterisks and check each part
		parts := strings.Split(query, "*")
		lastIndex := 0

		for _, part := range parts {
			if part == "" {
				continue
			}

			index := strings.Index(text[lastIndex:], part)
			if index == -1 {
				return false
			}
			lastIndex += index + len(part)
		}
		return true
	}

	// Check if query is contained in text (partial match)
	return strings.Contains(text, query)
}

// loginHandler handles user login
func loginHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	user, err := authenticateUser(req.Username, req.Password)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Error:   "Invalid credentials",
		})
		return
	}

	// Generate JWT token
	token, err := generateJWT(user)
	if err != nil {
		log.Printf("Failed to generate JWT: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Error:   "Failed to generate token",
		})
		return
	}

	log.Printf("✅ User %s logged in successfully", user.Username)

	json.NewEncoder(w).Encode(LoginResponse{
		Success: true,
		User:    user,
		Token:   token,
	})
}

// Role and Permission API handlers
func getRolesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// For now, always return mock data since we don't have a roles table in the database yet
	roles := getMockRoles()
	json.NewEncoder(w).Encode(roles)
}

func createRoleHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var role Role
	if err := json.NewDecoder(r.Body).Decode(&role); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// For mock implementation, generate an ID and timestamps
	role.ID = int(time.Now().Unix()) // Simple ID generation
	role.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	role.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	// In a real implementation, you would save to database here
	// For now, just return the created role
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(role)
}

func updateRoleHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	roleID, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid role ID"})
		return
	}

	var role Role
	if err := json.NewDecoder(r.Body).Decode(&role); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Set the ID from URL and update timestamp
	role.ID = roleID
	role.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	// In a real implementation, you would update in database here
	// For now, just return the updated role
	json.NewEncoder(w).Encode(role)
}

func deleteRoleHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	roleID, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid role ID"})
		return
	}

	// In a real implementation, you would delete from database here
	// For now, just return success
	w.WriteHeader(http.StatusNoContent)
	_ = roleID // Avoid unused variable warning
}

func getPermissionsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	permissions := getMockPermissions()
	json.NewEncoder(w).Encode(permissions)
}

// getOperClass helper function to get operator class
func getOperClass(user rpc.UserInfo) string {
	if user.IsOper {
		if user.OperClass != "" {
			return user.OperClass
		}
		return "O"
	}
	return ""
}

// WebSocket handler for real-time updates
func websocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	log.Println("Client connected to WebSocket")

	// Send initial data
	stats := getMockNetworkStats()
	if err := conn.WriteJSON(map[string]interface{}{
		"type": "networkStats",
		"data": stats,
	}); err != nil {
		log.Println("WebSocket write error:", err)
		return
	}

	// Keep connection alive and send periodic updates
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Send updated stats
			var stats interface{}
			if config.UseMockData || rpcClient == nil {
				stats = getMockNetworkStats()
			} else {
				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				if networkInfo, err := rpcClient.GetNetworkInfo(ctx); err == nil {
					stats = NetworkStats{
						UsersOnline: networkInfo.UsersOnline,
						Channels:    networkInfo.Channels,
						Servers:     networkInfo.Servers,
						Operators:   networkInfo.Operators,
					}
				} else {
					stats = getMockNetworkStats()
				}
				cancel()
			}

			if err := conn.WriteJSON(map[string]interface{}{
				"type": "networkStats",
				"data": stats,
			}); err != nil {
				log.Println("WebSocket write error:", err)
				return
			}
		default:
			// Check if connection is still alive
			if _, _, err := conn.ReadMessage(); err != nil {
				log.Println("WebSocket read error:", err)
				return
			}
		}
	}
}

// Utility function to join string slices
func joinStrings(strs []string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += strs[i]
	}
	return result
}

func main() {
	// Load configuration
	config = loadConfig()

	// Set JWT secret from config
	jwtSecret = []byte(config.JWTSecret)

	// Initialize database
	if err := initDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer func() {
		if db != nil {
			db.Close()
		}
	}()

	// Initialize RPC client
	initRPCClient()

	// Ensure RPC client is closed on exit
	defer func() {
		if rpcClient != nil {
			rpcClient.Disconnect()
		}
	}()

	// Create router
	r := mux.NewRouter()

	// Public routes (no authentication required)
	r.HandleFunc("/api/auth/login", loginHandler).Methods("POST")
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		status := map[string]interface{}{
			"status":        "ok",
			"rpc_connected": rpcClient != nil && rpcClient.IsConnected(),
			"mock_data":     config.UseMockData,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(status)
	}).Methods("GET")

	// Protected API routes
	api := r.PathPrefix("/api").Subrouter()
	api.Use(authMiddleware) // Apply authentication to all /api routes

	// Network endpoints (require user role or higher)
	networkRouter := api.PathPrefix("/network").Subrouter()
	networkRouter.Use(requireRole("user", "moderator", "admin"))
	networkRouter.HandleFunc("/stats", getNetworkStatsHandler).Methods("GET")
	networkRouter.HandleFunc("/health", getNetworkHealthHandler).Methods("GET")

	// User management (require user role or higher)
	userRouter := api.PathPrefix("/users").Subrouter()
	userRouter.Use(requireRole("user", "moderator", "admin"))
	userRouter.HandleFunc("", getUsersHandler).Methods("GET")

	// Channel management (require user role or higher)
	channelRouter := api.PathPrefix("/channels").Subrouter()
	channelRouter.Use(requireRole("user", "moderator", "admin"))
	channelRouter.HandleFunc("", getChannelsHandler).Methods("GET")
	channelRouter.HandleFunc("/{channel}/users", getChannelUsersHandler).Methods("GET")

	// Channel moderation (require moderator role or higher)
	moderationRouter := api.PathPrefix("/channels").Subrouter()
	moderationRouter.Use(requireRole("moderator", "admin"))
	moderationRouter.HandleFunc("/kick", kickUserHandler).Methods("POST")
	moderationRouter.HandleFunc("/ban", banUserHandler).Methods("POST")

	// Admin-only routes
	adminRouter := api.PathPrefix("").Subrouter()
	adminRouter.Use(requireRole("admin"))
	adminRouter.HandleFunc("/roles", getRolesHandler).Methods("GET")
	adminRouter.HandleFunc("/roles", createRoleHandler).Methods("POST")
	adminRouter.HandleFunc("/roles/{id}", updateRoleHandler).Methods("PUT")
	adminRouter.HandleFunc("/roles/{id}", deleteRoleHandler).Methods("DELETE")
	adminRouter.HandleFunc("/permissions", getPermissionsHandler).Methods("GET")

	// Search (require user role or higher)
	api.HandleFunc("/search", searchHandler).Methods("GET")

	// WebSocket endpoint (could add auth here too if needed)
	r.HandleFunc("/ws", websocketHandler)

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173"}, // React dev servers
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	// Wrap router with CORS
	handler := c.Handler(r)

	fmt.Printf("🚀 UnrealIRCd Admin Panel API server starting on port %s\n", config.Port)
	fmt.Printf("📊 API endpoints available at http://localhost:%s/api\n", config.Port)
	fmt.Printf("🔌 WebSocket endpoint at ws://localhost:%s/ws\n", config.Port)

	if config.UseMockData {
		fmt.Printf("⚠️  Using mock data (UnrealIRCd RPC not configured)\n")
	} else {
		fmt.Printf("🔗 Connected to UnrealIRCd RPC at %s\n", config.UnrealRPCURL)
	}

	log.Fatal(http.ListenAndServe(":"+config.Port, handler))
}
