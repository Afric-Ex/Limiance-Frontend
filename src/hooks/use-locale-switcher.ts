"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createTranslator, useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isLocale, localeCookieName, localeNames, locales, type Locale } from "@/i18n/routing";
import { userKeys, userService } from "@/src/services/user";
import { buildSettingsPayload } from "@/src/lib/user-settings";
import { useUserStore } from "@/src/stores/user-store";
import { successNotification } from "@/src/lib/notification-handler";
import { useLocaleMessages } from "@/src/components/providers/locale-provider";

const LOCALE_PREFIX_RE = new RegExp(`^/(${locales.join("|")})(?=/|$)`);

function persistLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${localeCookieName}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function useLocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const activeLocale = useLocale();
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();
  const { setLocale: applyLocale } = useLocaleMessages();
  const [isPending, startTransition] = useTransition();

  const { data: settings } = useQuery({
    queryKey: userKeys.settings,
    queryFn: () => userService.getSettings(),
    select: (response: any) => response.data ?? response,
    enabled: !!user,
    staleTime: 60_000,
  });

  const switchLocale = useCallback(
    (nextLocale: string) => {
      if (!isLocale(nextLocale) || nextLocale === activeLocale) return;

      persistLocaleCookie(nextLocale);

      const stripped = pathname.replace(LOCALE_PREFIX_RE, "") || "/";
      const search = typeof window !== "undefined" ? window.location.search : "";
      const target = `/${nextLocale}${stripped === "/" ? "" : stripped}${search}`;

      startTransition(() => {
        router.replace(target);
      });

      void (async () => {
        try {
          const messages = await applyLocale(nextLocale);
          const translate = createTranslator({
            locale: nextLocale,
            messages,
            namespace: "Settings",
          });
          successNotification(
            translate("languageChanged", { language: localeNames[nextLocale] })
          );
        } catch {
          // Fall back silently if the message bundle cannot be loaded.
        }

        if (!user) return;

        try {
          const current =
            settings ??
            (await userService.getSettings()).data ??
            null;
          await userService.updateSettings(
            buildSettingsPayload(current, { language: nextLocale })
          );
          queryClient.setQueryData(userKeys.settings, (previous: any) => {
            if (!previous) return previous;
            const body = previous.data ?? previous;
            const next = { ...body, language: nextLocale };
            return previous.data ? { ...previous, data: next } : next;
          });
          void queryClient.invalidateQueries({ queryKey: userKeys.settings });
        } catch {
          // The local language change still applies even if persisting fails.
        }
      })();
    },
    [activeLocale, applyLocale, pathname, queryClient, router, settings, user]
  );

  return {
    locale: (isLocale(activeLocale) ? activeLocale : "en") as Locale,
    switchLocale,
    isPending,
  };
}
