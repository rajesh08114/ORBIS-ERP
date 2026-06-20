"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

// ── Inner component so it has access to the Zustand store after hydration ────
function AuthSyncer() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    // Only refresh if hydrated (so we read persisted state first) and user is logged in.
    // This re-fetches the user's groups from /api/auth/me/ so any role change
    // made in Django admin is reflected immediately on next page load — without
    // requiring the user to log out and back in.
    if (hydrated && user) {
      refreshUser();
    }
  }, [hydrated]); // Run once after Zustand rehydrates from localStorage

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry(failureCount, error: any) {
          if (error?.status === 401 || error?.status === 403) {
            return false;
          }
          return failureCount < 3;
        }
      }
    }
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthSyncer />
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
