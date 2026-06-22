"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, setAuthToken, clearAuthToken } from "@/lib/api-client";

export type UserRole =
  | "Admin"
  | "Sales User"
  | "Purchase User"
  | "Manufacturing User"
  | "Inventory Manager"
  | "Business Owner";

export const availableRoles: UserRole[] = [
  "Admin",
  "Sales User",
  "Purchase User",
  "Manufacturing User",
  "Inventory Manager",
  "Business Owner",
];

const roleHomeMap: Record<string, string> = {
  Admin: "/dashboard",
  "Sales User": "/sales/orders",
  "Purchase User": "/purchase/orders",
  "Manufacturing User": "/manufacturing/command-center",
  "Inventory Manager": "/inventory",
  "Business Owner": "/dashboard",
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
    groups?: string[];
  };
};

type AuthState = {
  user: SessionUser | null;
  hydrated: boolean;
  login: (username: string, password: string, isAdminLogin?: boolean) => Promise<SessionUser | null>;
  register: (payload: any) => Promise<SessionUser | null>;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
  refreshUser: () => Promise<void>;
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
            if (isAdminLogin && !response.user.is_superuser && !response.user.is_staff) {
              throw new Error("You do not have Administrator privileges.");
            }
            
            let role: UserRole = "Sales User";
            if (response.user.is_superuser || response.user.is_staff) {
              role = "Admin";
            } else if (response.user.groups && response.user.groups.length > 0) {
              const matchedRole = response.user.groups.find((g: string) => availableRoles.includes(g as UserRole));
              if (matchedRole) {
                role = matchedRole as UserRole;
              }
            }

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
          // Returning null allows the component to show a toast, avoiding Unhandled Runtime Errors in Next.js
          return null;
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
            let role: UserRole = "Sales User";
            if (response.user.is_superuser || response.user.is_staff) {
              role = "Admin";
            } else if (response.user.groups && response.user.groups.length > 0) {
              const matchedRole = response.user.groups.find((g: string) => availableRoles.includes(g as UserRole));
              if (matchedRole) {
                role = matchedRole as UserRole;
              }
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
      refreshUser: async () => {
        // Re-fetch the current user's groups/role from the backend.
        // Called on app mount so any role changes in Django admin are reflected
        // without requiring the user to log out and log in again.
        try {
          const response = await apiClient<{ success: boolean; user: LoginResponse["user"] }>("auth/me/");
          if (!response.success) return;
          const u = response.user;
          let role: UserRole = "Sales User";
          if (u.is_superuser || u.is_staff) {
            role = "Admin";
          } else if (u.groups && u.groups.length > 0) {
            const matchedRole = u.groups.find((g: string) => availableRoles.includes(g as UserRole));
            if (matchedRole) role = matchedRole as UserRole;
          }
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  id: u.id,
                  username: u.username,
                  email: u.email,
                  first_name: u.first_name,
                  last_name: u.last_name,
                  role,
                  home: roleHomeMap[role] || "/dashboard",
                }
              : null,
          }));
        } catch {
          // If /me fails (e.g. expired token), silently skip — the
          // api-client interceptor will handle token refresh or redirect.
        }
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
