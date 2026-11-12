"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isLocale, localeCookieName, locales, type Locale } from "@/i18n/routing";
import { userKeys, userService } from "@/src/services/user";
import { buildSettingsPayload } from "@/src/lib/user-settings";
import { useUserStore } from "@/src/stores/user-store";

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
      if (typeof document !== "undefined") {
        document.documentElement.lang = nextLocale;
      }

      const stripped = pathname.replace(LOCALE_PREFIX_RE, "") || "/";
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      const target = `/${nextLocale}${stripped === "/" ? "" : stripped}${search}`;

      if (user) {
        void userService
          .updateSettings(
            buildSettingsPayload(settings, { language: nextLocale })
          )
          .then(() => queryClient.invalidateQueries({ queryKey: userKeys.settings }))
          .catch(() => undefined);
      }

      startTransition(() => {
        router.replace(target);
      });
    },
    [activeLocale, pathname, queryClient, router, settings, user]
  );

  return {
    locale: (isLocale(activeLocale) ? activeLocale : "en") as Locale,
    switchLocale,
    isPending,
  };
}
