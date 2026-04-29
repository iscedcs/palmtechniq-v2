import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateRandomAvatar } from "../utils";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "STUDENT" | "MENTOR" | "TUTOR" | "ADMIN";
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    skills?: string[];
    experience?: string;
    education?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const mockUser: User = {
            id: "1",
            email,
            firstName: "John",
            lastName: "Doe",
            role: "STUDENT",
            avatar: generateRandomAvatar(),
            isVerified: true,
            createdAt: new Date().toISOString(),
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            token: "mock-jwt-token",
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (data: any) => {
        set({ isLoading: true });
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const mockUser: User = {
            id: "1",
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role || "STUDENT",
            isVerified: false,
            createdAt: new Date().toISOString(),
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            token: "mock-jwt-token",
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
      },

      updateProfile: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          set({
            user: { ...user, ...data },
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setUser: (user: User) => set({ user, isAuthenticated: true }),
      setToken: (token: string) => set({ token }),
      clearAuth: () => set({ user: null, isAuthenticated: false, token: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);
