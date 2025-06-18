import { Channel, ChannelUser, User, NetworkStats } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    throw new ApiError('Authentication required', 401, response);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      errorText || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response
    );
  }

  return response.json();
}

// Channel service
export const channelService = {
  async getChannels(): Promise<Channel[]> {
    return apiRequest<Channel[]>('/channels');
  },

  async getChannelUsers(channelName: string): Promise<ChannelUser[]> {
    return apiRequest<ChannelUser[]>(
      `/channels/${encodeURIComponent(channelName)}/users`
    );
  },

  async createChannel(channelName: string, topic?: string): Promise<void> {
    return apiRequest('/channels', {
      method: 'POST',
      body: JSON.stringify({ name: channelName, topic }),
    });
  },

  async setChannelTopic(channelName: string, topic: string): Promise<void> {
    return apiRequest(`/channels/${encodeURIComponent(channelName)}/topic`, {
      method: 'PUT',
      body: JSON.stringify({ topic }),
    });
  },
};

// User service
export const userService = {
  async getUsers(): Promise<User[]> {
    return apiRequest<User[]>('/users');
  },

  async getUserInfo(nickname: string): Promise<User> {
    return apiRequest<User>(`/users/${encodeURIComponent(nickname)}`);
  },

  async kickUser(channelName: string, nickname: string, reason?: string): Promise<void> {
    return apiRequest(`/channels/${encodeURIComponent(channelName)}/kick`, {
      method: 'POST',
      body: JSON.stringify({ nickname, reason }),
    });
  },
};

// Network service
export const networkService = {
  async getNetworkStats(): Promise<NetworkStats> {
    return apiRequest<NetworkStats>('/network/stats');
  },
};

// Auth service
export const authService = {
  async login(username: string, password: string): Promise<{ token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new ApiError('Login failed', response.status, response);
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    return data;
  },

  logout(): void {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },
};