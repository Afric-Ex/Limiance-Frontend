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
import { WebSocketProvider } from "@/src/components/providers/websocket-provider";
import { getLocale, getMessages } from "next-intl/server";
import { LocaleProvider } from "@/src/components/providers/locale-provider";

export const metadata: Metadata = {
  title: "Limiance Exchange — Trade Crypto with Confidence",
  description:
    "Limiance Exchange is a secure, fast, and reliable cryptocurrency exchange. Trade Bitcoin, Ethereum, USDT, and 300+ digital assets with low fees and premium tools.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0d0e12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased overflow-x-hidden">
        <LocaleProvider locale={locale} messages={messages}>
          <Toaster />
          <MantineProvider theme={theme} forceColorScheme="dark">
            <WebSocketProvider>
              <Providers>
                <QueryProvider>
                  <ModalsProvider>
                    <NotificationsProvider />
                    <div className="flex h-[100dvh] flex-col overflow-hidden">
                      <Header />
                      <AppContainer>{children}</AppContainer>
                    </div>
                  </ModalsProvider>
                </QueryProvider>
              </Providers>
            </WebSocketProvider>
          </MantineProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
