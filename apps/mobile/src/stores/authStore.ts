import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '@/services/api/client';

interface User {
  id: string;
  email: string;
}

interface Session {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  hasCompletedOnboarding: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setOnboardingComplete: () => void;
}

// Custom storage adapter for SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isInitialized: false,
      hasCompletedOnboarding: false,

      initialize: async () => {
        const state = get();
        if (state.session?.accessToken) {
          try {
            // Verify token is still valid by fetching profile
            const response = await apiClient.get('/profile');
            if (response.data.success) {
              set({ isAuthenticated: true, isInitialized: true });
              return;
            }
          } catch (error) {
            // Token invalid, clear session
            set({ session: null, user: null, isAuthenticated: false });
          }
        }
        set({ isInitialized: true });
      },

      login: async (email: string, password: string) => {
        const response = await apiClient.post('/auth/login', { email, password });

        if (!response.data.success) {
          throw new Error(response.data.error?.message || 'Login failed');
        }

        const { user, session } = response.data.data;

        set({
          user: { id: user.id, email: user.email },
          session: {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          },
          isAuthenticated: true,
        });

        // Check onboarding status
        const profileResponse = await apiClient.get('/profile');
        if (profileResponse.data.success) {
          set({ hasCompletedOnboarding: profileResponse.data.data.onboarding_completed });
        }
      },

      register: async (email: string, password: string) => {
        const response = await apiClient.post('/auth/register', {
          email,
          password,
          confirmPassword: password,
        });

        if (!response.data.success) {
          throw new Error(response.data.error?.message || 'Registration failed');
        }

        const { user, session } = response.data.data;

        if (user && session) {
          set({
            user: { id: user.id, email: user.email },
            session: {
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
            },
            isAuthenticated: true,
            hasCompletedOnboarding: false,
          });
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch (error) {
          // Ignore errors during logout
        }

        set({
          user: null,
          session: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
        });
      },

      setOnboardingComplete: () => {
        set({ hasCompletedOnboarding: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        session: state.session,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
