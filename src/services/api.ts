const API_BASE_URL = 'http://localhost:8080/api';

// Add error handling for 401 responses
export const channelService = {
  async getChannels(): Promise<Channel[]> {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/channels`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch channels');
    }
    
    return response.json();
  },

  async getChannelUsers(channelName: string): Promise<ChannelUser[]> {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/channels/${encodeURIComponent(channelName)}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch channel users');
    }
    
    return response.json();
  }
};