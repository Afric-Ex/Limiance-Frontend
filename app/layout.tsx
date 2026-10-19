import type { Metadata, Viewport } from "next";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";
import Header from "@/src/components/shared/header";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { theme } from "@/src/utils/theme";
import { AppContainer } from "@/src/components/shared/app-container";
import QueryProvider from "@/src/providers/query-provider";
import { Toaster } from "react-hot-toast";
import Providers from "@/src/components/providers";
import { NotificationsProvider } from "@/src/components/shared/notifications-provider";

export const metadata: Metadata = {
  title: "Limiance Exchange — Trade Crypto with Confidence",
  description: "Limiance Exchange is a secure, fast, and reliable cryptocurrency exchange. Trade Bitcoin, Ethereum, USDT, and 300+ digital assets with low fees and premium tools.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0d0e12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased overflow-x-hidden">
        <Toaster />
        <MantineProvider theme={theme} forceColorScheme="dark">
          <Providers>
            <QueryProvider>
              <ModalsProvider>
                <NotificationsProvider />
                <AppContainer>
                  <Header />
                  {children}
                </AppContainer>
              </ModalsProvider>
            </QueryProvider>
          </Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
