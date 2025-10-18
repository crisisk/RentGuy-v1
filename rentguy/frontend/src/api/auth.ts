import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'manager' | 'finance' | 'crew';
    name: string;
  };
}

export const login = authAPI.login;
export const checkAuth = authAPI.checkAuth;
export const logout = authAPI.logout;
export const refreshToken = authAPI.refreshToken;
export const ssoLogin = authAPI.ssoLogin;

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // NOTE: The actual API endpoint is /auth/login, but we'll use a mock for now
    // until the backend is implemented.
    // const response = await apiClient.post('/auth/login', credentials);
    
    // Mock response for frontend integration
    const mockResponse: AuthResponse = {
        access_token: "mock_jwt_token_12345",
        refresh_token: "mock_refresh_token_67890",
        user: {
            id: "user-1",
            email: credentials.email,
            role: "admin",
            name: "Mock User",
        }
    };

    localStorage.setItem('auth_token', mockResponse.access_token);
    localStorage.setItem('refresh_token', mockResponse.refresh_token);
    return mockResponse;
  },

  logout: async (): Promise<void> => {
    // await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  },

  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refresh_token');
    // const response = await apiClient.post('/auth/refresh', { refreshToken });
    
    const newAccessToken = "mock_new_jwt_token_" + Date.now();
    localStorage.setItem('auth_token', newAccessToken);
    return newAccessToken;
  },

  // SSO Login (AzureAD, Google Workspace)


  checkAuth: async (): Promise<AuthResponse> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }
    // Mock response for frontend integration
    const mockResponse: AuthResponse = {
        access_token: token,
        refresh_token: localStorage.getItem('refresh_token') || "",
        user: {
            id: "user-1",
            email: "mock@user.com",
            role: "admin",
            name: "Mock User",
        }
    };
    return mockResponse;
  },

  ssoLogin: async (provider: 'azure' | 'google'): Promise<void> => {
    // window.location.href = `${apiClient.defaults.baseURL}/auth/sso/${provider}`;
    console.log(`Simulating SSO login for provider: ${provider}`);
  },
};

