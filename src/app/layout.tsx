import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4F46E5"
};

export const metadata: Metadata = {
  title: "MiQiX - Nền tảng học tập thông minh",
  description: "Trợ lý AI cá nhân giúp tối ưu hóa việc dạy và học.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MiQiX"
  },
  formatDetection: {
    telephone: false
  }
};

import { ToastProvider } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SubjectProvider } from "@/contexts/SubjectContext";
import { AIProvider } from "@/contexts/AIContext";
import { AIButler } from "@/components/features/ai/AIButler";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SubjectProvider>
          <AIProvider>
            <ToastProvider>
              <ErrorBoundary>
                {children}
                <AIButler />
              </ErrorBoundary>
            </ToastProvider>
          </AIProvider>
        </SubjectProvider>
      </body>
    </html>
  );
}
