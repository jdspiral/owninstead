import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import Constants from 'expo-constants';

// Lazy import to break circular dependency
const getAuthStore = () => require('@/stores/authStore').useAuthStore;

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_URL}/api/v1`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - attach auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const session = getAuthStore().getState().session;
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const session = getAuthStore().getState().session;
          if (!session?.refreshToken) {
            throw new Error('No refresh token');
          }

          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refreshToken: session.refreshToken,
          });

          if (response.data.success) {
            const newSession = response.data.data.session;

            // Update store with new tokens
            getAuthStore().setState({
              session: {
                accessToken: newSession.access_token,
                refreshToken: newSession.refresh_token,
              },
            });

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newSession.access_token}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          getAuthStore().getState().logout();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();
