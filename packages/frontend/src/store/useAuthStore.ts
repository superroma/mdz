import { create } from "zustand";
import * as api from "../api/client";

interface AuthStore {
  user: api.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<boolean>;
  login: (token: string) => void;
  logout: () => Promise<void>;
  hasGroup: (group: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  checkAuth: async () => {
    console.log("[Auth Store] Checking authentication...");
    const token = api.getAuthToken();
    
    if (!token) {
      console.log("[Auth Store] No token found");
      set({ isLoading: false, isAuthenticated: false, user: null });
      return false;
    }

    console.log("[Auth Store] Token found, verifying with backend...");
    try {
      const user = await api.getCurrentUser();
      if (!user.groups || user.groups.length === 0) {
        console.warn("[Auth Store] User has no authorized groups, logging out");
        api.removeAuthToken();
        set({ user: null, isLoading: false, isAuthenticated: false });
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "auth_error",
            JSON.stringify({
              type: "no_access",
              email: user.email,
            })
          );
        }
        const error = new Error("User has no authorized groups") as Error & {
          code?: string;
          email?: string;
        };
        error.code = "NO_ACCESS";
        error.email = user.email;
        throw error;
      }
      console.log("[Auth Store] User authenticated:", user.email);
      console.log("[Auth Store] User groups:", user.groups);
      set({ user, isLoading: false, isAuthenticated: true });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("auth_error");
      }
      return true;
    } catch (error) {
      console.error("[Auth Store] Token validation failed:", error);
      api.removeAuthToken();
      set({ user: null, isLoading: false, isAuthenticated: false });
      throw error;
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

  hasGroup: (group: string) => {
    const user = get().user;
    return user?.groups?.includes(group) || false;
  },

  isAdmin: () => {
    const user = get().user;
    return user?.groups?.includes("admins") || false;
  },
}));
