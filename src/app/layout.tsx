import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { TopProgressBar } from "@/components/layout/top-progress-bar";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://monitoring.tazakka.or.id"
  ),
  title: {
    default: "Dashboard Integrasi Tazakka",
    template: "%s | Dashboard Integrasi Tazakka",
  },
  description:
    "Portal terintegrasi pemantauan kinerja, standarisasi penilaian, dan pelaporan seluruh departemen di lingkungan Pondok Modern Tazakka.",
  keywords: [
    "Tazakka",
    "Pondok Modern Tazakka",
    "Monitoring Departemen",
    "Dashboard Integrasi",
    "Penilaian Kinerja",
    "SDM Tazakka",
    "Evaluasi Kinerja",
    "Sistem Informasi Tazakka",
  ],
  authors: [{ name: "Pondok Modern Tazakka", url: "https://tazakka.or.id" }],
  creator: "Pondok Modern Tazakka",
  publisher: "Pondok Modern Tazakka",
  applicationName: "Dashboard Integrasi Tazakka",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Dashboard Integrasi Tazakka",
    description:
      "Portal terintegrasi pemantauan kinerja, standarisasi penilaian, dan pelaporan seluruh departemen di lingkungan Pondok Modern Tazakka.",
    url: "/",
    siteName: "Dashboard Integrasi Tazakka",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/logo-tazakka.png",
        width: 1200,
        height: 630,
        alt: "Logo Tazakka - Dashboard Integrasi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard Integrasi Tazakka",
    description:
      "Portal terintegrasi pemantauan kinerja dan standardisasi evaluasi seluruh departemen Pondok Modern Tazakka.",
    images: ["/logo-tazakka.png"],
    creator: "@tazakka",
  },
  icons: {
    icon: [
      { url: "/logo-tazakka.png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tazakka Integrasi",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#047857" },
    { media: "(prefers-color-scheme: dark)", color: "#064e3b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <QueryProvider>
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <SpeedInsights />
            <Toaster richColors position="top-right" />
            <PwaRegister />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
