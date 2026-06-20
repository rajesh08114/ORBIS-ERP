"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // Keep query data fresh for 5 minutes to prevent instant reloading
        refetchOnWindowFocus: false, // Prevent distracting background refetches when focusing window
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
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
