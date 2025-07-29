import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Header } from "@/components/layout/Header";
import { OnboardingHandler } from "@/app/onboarding/onboarding-handler";
import { ErrorBoundary } from "@/components/error/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "D&D Connect",
  description: "Your ultimate companion for managing D&D campaigns",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "D&D Connect",
    description: "Your ultimate companion for managing D&D campaigns",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "D&D Connect",
    description: "Your ultimate companion for managing D&D campaigns",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        >
          <ConvexClientProvider>
            <ErrorBoundary>
              <OnboardingHandler />
              <div className="flex flex-col h-screen">
                <Header />
                <main className="flex-1 overflow-hidden">{children}</main>
              </div>
            </ErrorBoundary>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
