import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { AreaProvider } from "@/components/area-provider";
import { QuickAccountProvider } from "@/components/quick-account";
import { SessionProvider } from "@/components/session-provider";
import { PushMessageBridge } from "@/components/push-message-bridge";
import { siteDescription, siteName, siteUrl } from "@/lib/config";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Online shopping in Bangladesh`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", title: siteName, description: siteDescription },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#f85606",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-canvas text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SessionProvider>
          <PushMessageBridge />
          <AreaProvider>
            <QuickAccountProvider>
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
            </QuickAccountProvider>
          </AreaProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
