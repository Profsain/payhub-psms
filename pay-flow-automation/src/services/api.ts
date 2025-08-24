import { User, UserRole } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface SignupResponse {
  user: User;
  token: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(
    institutionName: string,
    email: string,
    phoneNumber: string,
    password: string
  ): Promise<ApiResponse<SignupResponse>> {
    return this.request<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        institutionName,
        email,
        phoneNumber,
        password,
      }),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  // Super admin endpoints
  async createSuperAdmin(
    email: string,
    password: string,
    name: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request<{ user: User; token: string }>('/auth/super-admin', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });
  }

  // Institution management
  async getInstitutions(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/institutions');
  }

  async getInstitution(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/institutions/${id}`);
  }

  // Staff management
  async getStaff(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/staff');
  }

  async getStaffMember(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/staff/${id}`);
  }

  // Payslip management
  async getPayslips(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/payslips');
  }

  async getPayslip(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/payslips/${id}`);
  }

  // Payment management
  async getPayments(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/payments');
  }

  async getPayment(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/payments/${id}`);
  }
}

export const apiService = new ApiService();
export default apiService; 