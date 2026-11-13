"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale, type Locale } from "@/i18n/routing";

type Messages = Record<string, any>;

const messageLoaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("@/messages/en.json"),
  fr: () => import("@/messages/fr.json"),
  da: () => import("@/messages/da.json"),
  de: () => import("@/messages/de.json"),
  es: () => import("@/messages/es.json"),
};

type LocaleContextValue = {
  setLocale: (locale: Locale) => Promise<Messages>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocaleMessages() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocaleMessages must be used within LocaleProvider");
  }
  return context;
}

export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: ReactNode;
}) {
  const [state, setState] = useState<{ locale: Locale; messages: Messages }>(
    () => ({ locale: (locale as Locale) || defaultLocale, messages })
  );

  useEffect(() => {
    setState((current) =>
      current.locale === locale ? current : { locale: locale as Locale, messages }
    );
  }, [locale, messages]);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    const loaded = await messageLoaders[nextLocale]();
    const nextMessages = loaded.default;
    setState({ locale: nextLocale, messages: nextMessages });
    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLocale;
    }
    return nextMessages;
  }, []);

  const value = useMemo(() => ({ setLocale }), [setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={state.locale} messages={state.messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
