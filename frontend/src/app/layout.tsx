import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { SparklesBackground } from "@/components/ui/sparkles";

export const metadata: Metadata = {
  title: "ORBIS ERP",
  description: "Production-grade ERP frontend for operations, procurement, manufacturing, inventory, and analytics."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative">
        <SparklesBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
