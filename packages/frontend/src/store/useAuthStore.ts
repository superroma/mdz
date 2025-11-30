import { create } from "zustand";
import * as api from "../api/client";

interface AuthStore {
  user: api.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  checkAuth: async () => {
    console.log("[Auth Store] Checking authentication...");
    const token = api.getAuthToken();
    
    if (!token) {
      console.log("[Auth Store] No token found");
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    console.log("[Auth Store] Token found, verifying with backend...");
    try {
      const user = await api.getCurrentUser();
      console.log("[Auth Store] User authenticated:", user.email);
      set({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      console.error("[Auth Store] Token validation failed:", error);
      api.removeAuthToken();
      set({ user: null, isLoading: false, isAuthenticated: false });
    }
  },

  login: (token: string) => {
    console.log("[Auth Store] Storing token in localStorage");
    api.setAuthToken(token);
    set({ isLoading: true });
  },

  logout: async () => {
    console.log("[Auth Store] Logging out...");
    try {
      await api.logout();
      console.log("[Auth Store] Logout successful");
    } catch (error) {
      console.error("[Auth Store] Logout error:", error);
    }
    set({ user: null, isAuthenticated: false });
  },
}));
