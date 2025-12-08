import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-client";
import { NetworkStatusIndicator } from "./components/NetworkStatusIndicator";
import { OfflineSyncProvider } from "@/lib/offline-sync-manager";
import { OfflineQueueBadge } from "./components/OfflineQueueStatus";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kastaem Desktop",
  description: "Kastaem Desktop Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <OfflineSyncProvider>
            <NetworkStatusIndicator />
            <OfflineQueueBadge />
            {children}
            <Toaster position="top-right" />
          </OfflineSyncProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
