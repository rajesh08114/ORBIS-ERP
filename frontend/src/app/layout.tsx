import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";

export const metadata: Metadata = {
  title: "ORBIS ERP",
  description: "Production-grade ERP frontend for operations, procurement, manufacturing, inventory, and analytics."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
