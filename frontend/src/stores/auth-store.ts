"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole =
  | "Administrator"
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

const roleHomeMap: Record<UserRole, string> = {
  Administrator: "/dashboard",
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
};

type AuthState = {
  user: SessionUser | null;
  hydrated: boolean;
  login: (username: string, password: string, role: UserRole) => SessionUser | null;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      login: (username, password, role) => {
        if (!username.trim() || !password.trim()) return null;
        const session: SessionUser = {
          username: username.trim(),
          role,
          home: roleHomeMap[role],
          loginTimestamp: new Date().toISOString(),
        };
        set({ user: session });
        return session;
      },
      logout: () => set({ user: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "orbis-auth",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
);
