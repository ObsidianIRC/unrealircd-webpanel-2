const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  active: boolean;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Role API methods
  async getRoles(): Promise<Role[]> {
    return this.request<Role[]>('/roles');
  }

  async createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    return this.request<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify(role),
    });
  }

  async updateRole(id: number, role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    return this.request<Role>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...role, id }),
    });
  }

  async deleteRole(id: number): Promise<void> {
    return this.request<void>(`/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Permission API methods
  async getPermissions(): Promise<Permission[]> {
    return this.request<Permission[]>('/permissions');
  }

  // Authentication API methods
  async login(username: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }
}

export const apiService = new ApiService();
