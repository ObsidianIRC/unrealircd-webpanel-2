package rpc

import (
	"bufio"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// RPCClient represents a connection to UnrealIRCd's RPC interface
type RPCClient struct {
	url        string
	username   string
	password   string
	conn       *websocket.Conn
	socketConn net.Conn // For UNIX socket connections
	mutex      sync.RWMutex
	reqID      int64
	pending    map[int64]chan *RPCResponse
	isSocket   bool // Track if we're using UNIX socket
}

// RPCRequest represents a JSON-RPC 2.0 request
type RPCRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
	ID      int64       `json:"id"`
}

// RPCResponse represents a JSON-RPC 2.0 response
type RPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *RPCError       `json:"error,omitempty"`
	ID      int64           `json:"id"`
}

// RPCError represents a JSON-RPC 2.0 error
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    string `json:"data,omitempty"`
}

// AuthParams for the auth.login method
type AuthParams struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// NetworkInfo represents network statistics
type NetworkInfo struct {
	UsersOnline int   `json:"users_online"`
	Channels    int   `json:"channels"`
	Servers     int   `json:"servers"`
	Operators   int   `json:"operators"`
	Uptime      int64 `json:"uptime"`
}

// UserInfo represents a user
type UserInfo struct {
	Nick        string   `json:"nick"`
	Hostname    string   `json:"hostname"`
	IP          string   `json:"ip"`
	Country     string   `json:"country"`
	Account     string   `json:"account"`
	Realname    string   `json:"realname"`
	Server      string   `json:"server"`
	ConnectTime int64    `json:"connect_time"`
	IsOper      bool     `json:"is_oper"`
	OperClass   string   `json:"oper_class"`
	Modes       []string `json:"modes"`
}

// ChannelInfo represents a channel
type ChannelInfo struct {
	Name         string        `json:"name"`
	UserCount    int           `json:"num_users"`     // Note: UnrealIRCd uses "num_users"
	Topic        string        `json:"topic"`
	CreationTime string        `json:"creation_time"` // Change to string to handle ISO format
	TopicSetBy   string        `json:"topic_set_by"`
	TopicSetAt   string        `json:"topic_set_at"`
	Modes        string        `json:"modes"`         // UnrealIRCd returns this as a string, not []string
	Users        []ChannelUser `json:"users,omitempty"`
}

// ChannelUser represents a user in a channel
type ChannelUser struct {
	Nick   string   `json:"nick"`
	Modes  []string `json:"modes"`
	Joined int64    `json:"joined"`
}

// NewRPCClient creates a new RPC client
func NewRPCClient(url, username, password string) *RPCClient {
	return &RPCClient{
		url:      url,
		username: username,
		password: password,
		pending:  make(map[int64]chan *RPCResponse),
	}
}

// Connect establishes a connection to UnrealIRCd RPC
func (c *RPCClient) Connect(ctx context.Context) error {
	log.Printf("🔌 Starting RPC connection process...")

	c.mutex.Lock()
	defer c.mutex.Unlock()

	// Check if it's a UNIX socket path
	if c.url == "unix" || c.url == "" {
		return c.connectUnixSocket(ctx)
	}

	// Try WebSocket connection
	return c.connectWebSocket(ctx)
}

// connectUnixSocket connects via UNIX domain socket
func (c *RPCClient) connectUnixSocket(ctx context.Context) error {
	socketPath := "/home/valerie/unrealircd/data/rpc.socket" // Adjust this path
	log.Printf("🔌 Connecting to UNIX socket: %s", socketPath)

	var d net.Dialer
	conn, err := d.DialContext(ctx, "unix", socketPath)
	if err != nil {
		log.Printf("❌ Failed to connect to UNIX socket: %v", err)
		return fmt.Errorf("failed to connect to UNIX socket: %w", err)
	}

	log.Printf("✅ Connected to UNIX socket successfully!")
	c.socketConn = conn
	c.isSocket = true

	// Start message handler for socket
	go c.handleSocketMessages()

	return nil
}

// connectWebSocket connects via WebSocket
func (c *RPCClient) connectWebSocket(ctx context.Context) error {
	log.Printf("📝 Parsing RPC URL: %s", c.url)

	// Parse and validate URL
	u, err := url.Parse(c.url)
	if err != nil {
		log.Printf("❌ Failed to parse URL: %v", err)
		return fmt.Errorf("invalid RPC URL: %w", err)
	}

	log.Printf("   Scheme: %s", u.Scheme)
	log.Printf("   Host: %s", u.Host)
	log.Printf("   Path: %s", u.Path)

	// Ensure we're using the correct WebSocket scheme
	originalScheme := u.Scheme
	if u.Scheme == "http" || u.Scheme == "tcp" {
		u.Scheme = "ws"
	} else if u.Scheme == "https" || u.Scheme == "tls" {
		u.Scheme = "wss"
	}

	if originalScheme != u.Scheme {
		log.Printf("🔄 Converted scheme from %s to %s", originalScheme, u.Scheme)
	}

	finalURL := u.String()
	log.Printf("🎯 Final WebSocket URL: %s", finalURL)

	// Create Basic Auth header
	authHeader := fmt.Sprintf("Basic %s", basicAuth(c.username, c.password))

	// Connect to WebSocket with detailed logging and TLS config
	dialer := websocket.DefaultDialer
	dialer.HandshakeTimeout = 10 * time.Second

	// Disable TLS certificate verification for development/self-signed certs
	dialer.TLSClientConfig = &tls.Config{
		InsecureSkipVerify: true,
	}

	// Set Authorization header
	headers := make(map[string][]string)
	headers["Authorization"] = []string{authHeader}

	log.Printf("🔓 TLS certificate verification disabled")
	log.Printf("🔐 Adding Basic Auth header")
	log.Printf("⏰ Setting handshake timeout to %v", dialer.HandshakeTimeout)
	log.Printf("🚀 Attempting WebSocket connection...")

	start := time.Now()
	conn, resp, err := dialer.DialContext(ctx, finalURL, headers)
	duration := time.Since(start)

	if err != nil {
		log.Printf("❌ WebSocket connection failed after %v", duration)
		log.Printf("   Error: %v", err)

		if resp != nil {
			log.Printf("📄 HTTP Response received:")
			log.Printf("   Status: %s", resp.Status)
			log.Printf("   Status Code: %d", resp.StatusCode)
			log.Printf("   Headers:")
			for key, values := range resp.Header {
				for _, value := range values {
					log.Printf("     %s: %s", key, value)
				}
			}
		} else {
			log.Printf("📄 No HTTP response received (connection likely refused)")
		}

		return fmt.Errorf("failed to connect to WebSocket: %w", err)
	}

	log.Printf("✅ WebSocket connection established in %v", duration)
	c.conn = conn
	c.isSocket = false

	// Start message handler
	log.Printf("🎧 Starting message handler goroutine...")
	go c.handleMessages()

	log.Printf("🎉 Successfully connected to UnrealIRCd RPC!")
	return nil
}

// handleSocketMessages handles incoming messages from UNIX socket
func (c *RPCClient) handleSocketMessages() {
	scanner := bufio.NewScanner(c.socketConn)
	for scanner.Scan() {
		line := scanner.Text()
		log.Printf("📨 Received from socket: %s", line)

		var response RPCResponse
		if err := json.Unmarshal([]byte(line), &response); err != nil {
			log.Printf("❌ Failed to unmarshal response: %v", err)
			continue
		}

		// Handle the response
		c.mutex.RLock()
		ch, exists := c.pending[response.ID]
		c.mutex.RUnlock()

		if exists {
			select {
			case ch <- &response:
			default:
			}
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("❌ Socket scanner error: %v", err)
	}
}

// authenticate performs RPC authentication
func (c *RPCClient) authenticate(ctx context.Context) error {
	log.Printf("🔑 Preparing authentication request...")

	params := AuthParams{
		Username: c.username,
		Password: c.password,
	}

	log.Printf("📤 Sending login request with username: %s", c.username)

	var result json.RawMessage
	err := c.call(ctx, "user.login", params, &result)
	if err != nil {
		log.Printf("❌ Login call failed: %v", err)
		return fmt.Errorf("login failed: %w", err)
	}

	log.Printf("✅ Authentication successful!")
	log.Printf("📥 Login response: %s", string(result))
	return nil
}

// handleMessages handles incoming WebSocket messages
func (c *RPCClient) handleMessages() {
	log.Printf("🎧 Message handler started")

	for {
		c.mutex.RLock()
		conn := c.conn
		c.mutex.RUnlock()

		if conn == nil {
			log.Printf("🛑 Connection is nil, stopping message handler")
			break
		}

		log.Printf("👂 Waiting for message...")

		var response RPCResponse
		err := conn.ReadJSON(&response)
		if err != nil {
			log.Printf("❌ RPC read error: %v", err)
			log.Printf("🔍 Error type: %T", err)
			break
		}

		log.Printf("📥 Received RPC response:")
		log.Printf("   ID: %d", response.ID)
		log.Printf("   JSONRPC: %s", response.JSONRPC)

		if response.Error != nil {
			log.Printf("   Error: Code=%d, Message=%s, Data=%s",
				response.Error.Code, response.Error.Message, response.Error.Data)
		} else {
			log.Printf("   Result: %s", string(response.Result))
		}

		// Handle response
		c.mutex.Lock()
		if ch, exists := c.pending[response.ID]; exists {
			log.Printf("✅ Found pending request for ID %d, sending response", response.ID)
			delete(c.pending, response.ID)
			c.mutex.Unlock()
			ch <- &response
		} else {
			log.Printf("⚠️  No pending request found for ID %d", response.ID)
			c.mutex.Unlock()
		}
	}

	log.Printf("🏁 Message handler stopped")
}

// call makes an RPC call
func (c *RPCClient) call(ctx context.Context, method string, params interface{}, result interface{}) error {
	log.Printf("📞 Making RPC call: %s", method)

	c.mutex.Lock()
	c.reqID++
	reqID := c.reqID

	if c.conn == nil {
		c.mutex.Unlock()
		log.Printf("❌ Cannot make call: not connected")
		return fmt.Errorf("not connected")
	}

	// Create response channel
	respCh := make(chan *RPCResponse, 1)
	c.pending[reqID] = respCh
	log.Printf("📋 Created pending request with ID: %d", reqID)
	c.mutex.Unlock()

	// Create request
	req := RPCRequest{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      reqID,
	}

	// Log the request
	reqJSON, _ := json.MarshalIndent(req, "", "  ")
	log.Printf("📤 Sending request:\n%s", string(reqJSON))

	// Send request
	c.mutex.RLock()
	err := c.conn.WriteJSON(req)
	c.mutex.RUnlock()

	if err != nil {
		log.Printf("❌ Failed to send request: %v", err)
		c.mutex.Lock()
		delete(c.pending, reqID)
		c.mutex.Unlock()
		return fmt.Errorf("failed to send request: %w", err)
	}

	log.Printf("✅ Request sent, waiting for response...")

	// Wait for response
	select {
	case resp := <-respCh:
		log.Printf("📥 Received response for request ID %d", reqID)

		if resp.Error != nil {
			log.Printf("❌ RPC returned error: Code=%d, Message=%s", resp.Error.Code, resp.Error.Message)
			return fmt.Errorf("RPC error %d: %s", resp.Error.Code, resp.Error.Message)
		}

		if result != nil && resp.Result != nil {
			log.Printf("🔄 Unmarshaling result into provided structure")
			err := json.Unmarshal(resp.Result, result)
			if err != nil {
				log.Printf("❌ Failed to unmarshal result: %v", err)
				return err
			}
			log.Printf("✅ Result unmarshaled successfully")
		}

		log.Printf("✅ RPC call completed successfully")
		return nil

	case <-ctx.Done():
		log.Printf("⏰ Context cancelled for request ID %d", reqID)
		c.mutex.Lock()
		delete(c.pending, reqID)
		c.mutex.Unlock()
		return ctx.Err()

	case <-time.After(30 * time.Second):
		log.Printf("⏰ Request timeout for ID %d", reqID)
		c.mutex.Lock()
		delete(c.pending, reqID)
		c.mutex.Unlock()
		return fmt.Errorf("request timeout")
	}
}

// GetNetworkInfo gets network statistics
func (c *RPCClient) GetNetworkInfo(ctx context.Context) (*NetworkInfo, error) {
	log.Printf("📊 Getting network info...")

	var result struct {
		Users    int   `json:"users"`
		Channels int   `json:"channels"`
		Servers  int   `json:"servers"`
		Opers    int   `json:"opers"`
		Uptime   int64 `json:"uptime"`
	}

	err := c.call(ctx, "stats.get", nil, &result)
	if err != nil {
		log.Printf("❌ Failed to get network info: %v", err)
		return nil, err
	}

	networkInfo := &NetworkInfo{
		UsersOnline: result.Users,
		Channels:    result.Channels,
		Servers:     result.Servers,
		Operators:   result.Opers,
		Uptime:      result.Uptime,
	}

	log.Printf("✅ Network info retrieved: %+v", networkInfo)
	return networkInfo, nil
}

// GetUsers gets the list of users
func (c *RPCClient) GetUsers(ctx context.Context) ([]UserInfo, error) {
	log.Printf("👥 Getting user list...")

	var result struct {
		List []UserInfo `json:"list"`
	}

	err := c.call(ctx, "user.list", nil, &result)
	if err != nil {
		log.Printf("❌ Failed to get users: %v", err)
		return nil, err
	}

	log.Printf("✅ Retrieved %d users", len(result.List))
	return result.List, nil
}

// GetChannels gets the list of channels
func (c *RPCClient) GetChannels(ctx context.Context) ([]ChannelInfo, error) {
	log.Printf("📺 Getting channel list...")

	var result struct {
		List []ChannelInfo `json:"list"`
	}

	err := c.call(ctx, "channel.list", nil, &result)
	if err != nil {
		log.Printf("❌ Failed to get channels: %v", err)
		return nil, err
	}

	log.Printf("✅ Retrieved %d channels", len(result.List))
	return result.List, nil
}

// GetChannelUsers gets users in a specific channel
func (c *RPCClient) GetChannelUsers(ctx context.Context, channel string) ([]ChannelUser, error) {
	log.Printf("👥 Getting users for channel: %s", channel)

	params := map[string]string{"channel": channel}

	var result struct {
		Users []ChannelUser `json:"users"`
	}

	err := c.call(ctx, "channel.get", params, &result)
	if err != nil {
		log.Printf("❌ Failed to get channel users: %v", err)
		return nil, err
	}

	log.Printf("✅ Retrieved %d users for channel %s", len(result.Users), channel)
	return result.Users, nil
}

// KickUser kicks a user from a channel
func (c *RPCClient) KickUser(ctx context.Context, channel, nick, reason string) error {
	log.Printf("👢 Kicking user %s from %s (reason: %s)", nick, channel, reason)

	params := map[string]string{
		"channel": channel,
		"nick":    nick,
		"reason":  reason,
	}

	err := c.call(ctx, "channel.kick", params, nil)
	if err != nil {
		log.Printf("❌ Failed to kick user: %v", err)
		return err
	}

	log.Printf("✅ User kicked successfully")
	return nil
}

// BanUser bans a user from a channel
func (c *RPCClient) BanUser(ctx context.Context, channel, mask, reason string) error {
	log.Printf("🚫 Banning user %s from %s (reason: %s)", mask, channel, reason)

	params := map[string]string{
		"channel": channel,
		"mask":    mask,
		"reason":  reason,
	}

	err := c.call(ctx, "channel.ban_add", params, nil)
	if err != nil {
		log.Printf("❌ Failed to ban user: %v", err)
		return err
	}

	log.Printf("✅ User banned successfully")
	return nil
}

// SendLog sends a log message to UnrealIRCd (requires UnrealIRCd 6.1.8+)
func (c *RPCClient) SendLog(ctx context.Context, message, level, subsystem, eventID string) error {
	log.Printf("📝 Sending log message: %s (level: %s, subsystem: %s, event_id: %s)",
		message, level, subsystem, eventID)

	params := map[string]string{
		"msg":       message,
		"level":     level,
		"subsystem": subsystem,
		"event_id":  eventID,
	}

	var result interface{}
	err := c.call(ctx, "log.send", params, &result)
	if err != nil {
		log.Printf("❌ Failed to send log message: %v", err)
		return err
	}

	log.Printf("✅ Log message sent successfully")
	return nil
}

// SendCopilotLog sends the specific "Co-pilot is the best" message
func (c *RPCClient) SendCopilotLog(ctx context.Context) error {
	return c.SendLog(ctx, "Co-pilot is the best", "info", "admin", "COPILOT_MESSAGE")
}

// IsConnected checks if the client is connected
func (c *RPCClient) IsConnected() bool {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	connected := c.conn != nil
	log.Printf("🔍 Connection status check: %t", connected)
	return connected
}

// Disconnect closes the RPC connection
func (c *RPCClient) Disconnect() {
	log.Printf("🔌 Disconnecting RPC client...")

	c.mutex.Lock()
	defer c.mutex.Unlock()

	if c.conn != nil {
		log.Printf("🔒 Closing WebSocket connection...")
		c.conn.Close()
		c.conn = nil
		log.Printf("✅ WebSocket connection closed")
	}

	// Close all pending channels
	log.Printf("🧹 Cleaning up %d pending requests...", len(c.pending))
	for id, ch := range c.pending {
		log.Printf("   Closing pending request ID: %d", id)
		close(ch)
	}
	c.pending = make(map[int64]chan *RPCResponse)

	log.Printf("✅ RPC client disconnected")
}

// Helper function for basic auth
func basicAuth(username, password string) string {
	auth := username + ":" + password
	return base64Encode(auth)
}

func base64Encode(s string) string {
	// Simple base64 encoding
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
	var result []byte

	for i := 0; i < len(s); i += 3 {
		var b [4]byte
		var n int

		// First character
		b[0] = chars[s[i]>>2]
		n = (int(s[i]) & 0x03) << 4

		if i+1 < len(s) {
			n |= int(s[i+1]) >> 4
			b[1] = chars[n]
			n = (int(s[i+1]) & 0x0f) << 2

			if i+2 < len(s) {
				n |= int(s[i+2]) >> 6
				b[2] = chars[n]
				b[3] = chars[int(s[i+2])&0x3f]
			} else {
				b[2] = chars[n]
				b[3] = '='
			}
		} else {
			b[1] = chars[n]
			b[2] = '='
			b[3] = '='
		}

		result = append(result, b[:]...)
	}

	return string(result)
}

// parseISOTime converts ISO 8601 timestamp to Unix timestamp
func parseISOTime(isoTime string) int64 {
	if isoTime == "" {
		return 0
	}

	t, err := time.Parse("2006-01-02T15:04:05.000Z", isoTime)
	if err != nil {
		log.Printf("⚠️ Failed to parse timestamp %s: %v", isoTime, err)
		return 0
	}

	return t.Unix()
}

// parseModesString converts mode string to slice
func parseModesString(modes string) []string {
	if modes == "" {
		return []string{}
	}

	// Split modes by spaces and filter out empty strings
	parts := strings.Fields(modes)
	if len(parts) == 0 {
		return []string{}
	}

	// Return the first part which contains the actual modes
	// Example: "ntCHP 50:30d" -> ["ntCHP", "50:30d"]
	return parts
}
