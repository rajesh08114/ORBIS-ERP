"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, setAuthToken, clearAuthToken } from "@/lib/api-client";

export type UserRole =
  | "Administrator"
  | "System User"
  | "Inventory Manager"
  | "Procurement Manager"
  | "Manufacturing Manager"
  | "Sales Manager";

export const availableRoles: UserRole[] = [
  "Administrator",
  "Inventory Manager",
  "Procurement Manager",
  "Manufacturing Manager",
  "Sales Manager",
];

const roleHomeMap: Record<string, string> = {
  Administrator: "/dashboard",
  "System User": "/dashboard",
  "Inventory Manager": "/inventory",
  "Procurement Manager": "/purchase/orders",
  "Manufacturing Manager": "/manufacturing/command-center",
  "Sales Manager": "/sales/orders",
};

export type SessionUser = {
  username: string;
  role: UserRole;
  home: string;
  loginTimestamp: string;
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
};

type LoginResponse = {
  access: string;
  refresh: string;
  success: boolean;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_superuser: boolean;
  };
};

type AuthState = {
  user: SessionUser | null;
  hydrated: boolean;
  login: (username: string, password: string, isAdminLogin?: boolean) => Promise<SessionUser | null>;
  register: (payload: any) => Promise<SessionUser | null>;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      login: async (username, password, isAdminLogin = false) => {
        if (!username.trim() || !password.trim()) return null;
        try {
          const response = await apiClient<LoginResponse>("auth/login/", {
            method: "POST",
            body: JSON.stringify({ username: username.trim(), password }),
          });

          if (response.success && response.access) {
            if (isAdminLogin && !response.user.is_staff && !response.user.is_superuser) {
              console.error("User is not an administrator");
              return null;
            }
            
            const role: UserRole = response.user.is_superuser || response.user.is_staff ? "Administrator" : "System User";

            setAuthToken(response.access);
            if (typeof window !== "undefined") {
              localStorage.setItem("refresh_token", response.refresh);
            }
            const session: SessionUser = {
              id: response.user.id,
              username: response.user.username,
              email: response.user.email,
              first_name: response.user.first_name,
              last_name: response.user.last_name,
              role,
              home: roleHomeMap[role] || "/dashboard",
              loginTimestamp: new Date().toISOString(),
            };
            set({ user: session });
            return session;
          }
          return null;
        } catch (error: any) {
          console.error("Login failed:", error);
          throw error;
        }
      },
      register: async (payload: any) => {
        try {
          const response = await apiClient<LoginResponse>("auth/register/", {
            method: "POST",
            body: JSON.stringify(payload),
          });

          if (response.success && response.access) {
            setAuthToken(response.access);
            if (typeof window !== "undefined") {
              localStorage.setItem("refresh_token", response.refresh);
            }
            const role: UserRole = "System User"; // Default for new signups
            const session: SessionUser = {
              id: response.user.id,
              username: response.user.username,
              email: response.user.email,
              first_name: response.user.first_name,
              last_name: response.user.last_name,
              role,
              home: roleHomeMap[role] || "/dashboard",
              loginTimestamp: new Date().toISOString(),
            };
            set({ user: session });
            return session;
          }
          return null;
        } catch (error: any) {
          console.error("Register failed:", error);
          if (error.data) throw error; // Throw to handle specific field errors in UI
          return null;
        }
      },
      logout: () => {
        clearAuthToken();
        if (typeof window !== "undefined") {
          localStorage.removeItem("refresh_token");
        }
        set({ user: null });
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "orbis-auth",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
);
