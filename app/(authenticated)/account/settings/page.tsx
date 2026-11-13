"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { buildSettingsPayload } from "@/src/lib/user-settings";
import { api } from "@/src/lib/axios";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader } from "@mantine/core";
import {
  MdAccessTime,
  MdCheck,
  MdErrorOutline,
  MdOutlineNotificationsActive,
  MdOutlinePalette,
  MdOutlineSettings,
} from "react-icons/md";
import clsx from "clsx";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountSettingsSkeleton } from "@/src/components/skeletons/account";
import { AccountPageHeader } from "@/src/components/settings/account-page-header";
import { useLocale, useTranslations } from "next-intl";
import { useLocaleSwitcher } from "@/src/hooks/use-locale-switcher";
import { locales, localeNames, isLocale } from "@/i18n/routing";

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "USDT"];

type SaveStatus = "idle" | "saving" | "saved" | "error";

const preferenceGroups = [
  {
    key: "notificationPreference",
    titleKey: "accountNotifications",
    descriptionKey: "accountActivityDetail",
    options: [
      { key: "activities", labelKey: "accountActivity", detailKey: "accountActivityDetail" },
      { key: "tradeNotification", labelKey: "tradeUpdates", detailKey: "tradeUpdatesDetail" },
      { key: "news", labelKey: "productNews", detailKey: "productNewsDetail" },
      { key: "systemMessages", labelKey: "systemMessages", detailKey: "systemMessagesDetail" },
    ],
  },
  {
    key: "priceAlerts",
    titleKey: "priceAlerts",
    descriptionKey: "priceAlerts",
    options: [
      { key: "priceOn", labelKey: "priceAlerts", detailKey: "priceAlerts" },
      { key: "notificationOn", labelKey: "notifications", detailKey: "notifications" },
    ],
  },
  {
    key: "transactionNotifications",
    titleKey: "tradeNotifications",
    descriptionKey: "tradeNotifications",
    options: [
      { key: "spotTradingNotification", labelKey: "spotTrading", detailKey: "spotTradingDetail" },
      { key: "spotNotificationSound", labelKey: "spotSounds", detailKey: "spotSoundsDetail" },
      { key: "futuresTradingNotification", labelKey: "futuresTrading", detailKey: "futuresTradingDetail" },
      { key: "futuresNotificationSound", labelKey: "futuresSounds", detailKey: "futuresSoundsDetail" },
    ],
  },
  {
    key: "tradeOrdersNotificationReminder",
    titleKey: "orderConfirmations",
    descriptionKey: "orderConfirmations",
    options: [
      { key: "limitOrder", labelKey: "limitOrders" },
      { key: "marketOrder", labelKey: "marketOrders" },
      { key: "stopOrder", labelKey: "stopOrders" },
      { key: "autoBorrowRepayMargin", labelKey: "autoBorrowRepayMargin" },
    ],
  },
  {
    key: "tradeFeeDeductions",
    titleKey: "feeDeductions",
    descriptionKey: "feeDeductions",
    options: [
      { key: "useLIMToPayFees", labelKey: "spotFees" },
      { key: "useLIMToPayMarginFees", labelKey: "marginFees" },
      { key: "useLIMToPayFuturesFees", labelKey: "futuresFees" },
    ],
  },
] as const;

function SettingsPageInner() {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const { switchLocale } = useLocaleSwitcher();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevValuesRef = useRef<Record<string, any>>({});

  // Load settings
  const {
    data: settings,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: userKeys.settings,
    queryFn: () => userService.getSettings(),
    select: (res: any) => res.data ?? res,
  });

  // Load timezones
  const { data: timezones, isLoading: tzsLoading, isError: tzsError } = useQuery({
    queryKey: ["timezones"],
    queryFn: async () => {
      const res = await api.get("/timezones");
      return res.data?.data ?? res.data ?? [];
    },
  });

  // Local form state
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState(locale);
  const languageCorrectedRef = useRef(false);
  const [timezone, setTimezone] = useState("UTC");
  const [tzSearch, setTzSearch] = useState("");
  const [tzDropOpen, setTzDropOpen] = useState(false);
  const tzDropRef = useRef<HTMLDivElement>(null);

  const tzValue = useCallback((tz: any): string => {
    if (typeof tz === "string") return tz;
    return tz.locatonName ?? tz.locationName ?? tz.value ?? tz.code ?? tz.name ?? "";
  }, []);

  const tzLabel = useCallback((tz: any): string => {
    if (typeof tz === "string") return tz;
    const name = tz.name ?? tz.locatonName ?? tz.locationName ?? tz.code ?? "";
    const offset = tz.offsetString ? ` (${tz.offsetString})` : "";
    return `${name}${offset}`.trim();
  }, []);

  // The backend only accepts IANA timezone identifiers (e.g. "Africa/Lagos").
  // Older saves may contain a display label, so normalise whatever we hold
  // before every PATCH to avoid the "timezone must be a valid timezone" error.
  const normalizeTimezone = useCallback(
    (value?: string | null): string => {
      const raw = (value ?? "").trim();
      if (!raw) return "UTC";
      const match = (timezones ?? []).find((tz: any) => {
        if (typeof tz === "string") return tz === raw;
        return (
          tzValue(tz) === raw ||
          tz.locatonName === raw ||
          tz.locationName === raw ||
          tz.name === raw ||
          tz.code === raw
        );
      });
      if (match) return tzValue(match);
      return raw.includes("/") ? raw : "UTC";
    },
    [timezones, tzValue]
  );

  // Seed from API
  useEffect(() => {
    if (!settings) return;
    if (isLocale(settings.language)) {
      setLanguage(settings.language);
      if (!languageCorrectedRef.current && settings.language !== locale) {
        languageCorrectedRef.current = true;
        switchLocale(settings.language);
      }
    }
    if (settings.timezone) setTimezone(settings.timezone);
    prevValuesRef.current = {
      language: settings.language ?? "en",
      timezone: settings.timezone ?? "UTC",
    };
  }, [settings, locale, switchLocale]);

  // Close tz dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tzDropRef.current && !tzDropRef.current.contains(e.target as Node)) setTzDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { mutate: saveSettings } = useMutation({
    mutationFn: (data: Record<string, any>) => userService.saveSettings(data),
    onSuccess: (_response, data) => {
      prevValuesRef.current = { ...prevValuesRef.current, ...data };
      setSaveStatus("saved");
      void refetchSettings();
    },
    onError: (e: any) => {
      errorMessageHandler(e);
      setSaveStatus("error");
      // revert to previous values
      setLanguage(prevValuesRef.current.language ?? "en");
      setTimezone(prevValuesRef.current.timezone ?? "UTC");
    },
  });

  const debouncedSave = useCallback(
    (patch: Record<string, any>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveStatus("saving");
      const payloadPatch = {
        ...patch,
        timezone: normalizeTimezone(patch.timezone ?? (settings as any)?.timezone),
      };
      debounceRef.current = setTimeout(() => {
        saveSettings(buildSettingsPayload(settings, payloadPatch));
        setTimeout(() => setSaveStatus("idle"), 2500);
      }, 500);
    },
    [saveSettings, settings, normalizeTimezone]
  );

  // Display currency is a local presentation preference; the backend settings
  // contract does not include it, so it is not persisted.
  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
  };

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    if (isLocale(val)) switchLocale(val);
  };

  const handleTimezoneChange = (val: string) => {
    setTimezone(val);
    setTzDropOpen(false);
    setTzSearch("");
    debouncedSave({ timezone: val });
  };

  const togglePreference = (group: string, key: string, enabled: boolean) => {
    const currentGroup = (settings as any)?.[group];
    if (!currentGroup || typeof currentGroup !== "object") return;
    setSaveStatus("saving");
    saveSettings(
      buildSettingsPayload(settings, {
        [group]: {
          ...currentGroup,
          [key]: !enabled,
        },
        timezone: normalizeTimezone((settings as any)?.timezone),
      } as any)
    );
  };

  const filteredTz = (timezones ?? []).filter((tz: any) =>
    tzLabel(tz).toLowerCase().includes(tzSearch.toLowerCase())
  );

  const selectedTimezoneLabel = (() => {
    const normalized = normalizeTimezone(timezone);
    const match = (timezones ?? []).find((tz: any) => tzValue(tz) === normalized);
    return match ? tzLabel(match) : timezone;
  })();

  const isLoading = settingsLoading;
  const isPreferenceEnabled = (group: string, key: string) =>
    Boolean((settings as any)?.[group]?.[key]);

  return (
    <main className="page-enter mx-auto flex w-full max-w-[1180px] flex-col gap-5 pb-8 max-[1150px]:pb-[100px]">
      <AccountPageHeader
        title={t("accountSettings")}
        description={t("settingsDescription")}
        icon={<MdOutlineSettings size={23} />}
        eyebrow={t("preferencesEyebrow")}
        action={
          saveStatus !== "idle" ? (
            <span
              role="status"
              className={clsx(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold",
                saveStatus === "error"
                  ? "border-red-400/20 bg-red-400/[0.07] text-red-300"
                  : saveStatus === "saved"
                    ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                    : "border-white/[0.08] bg-white/[0.03] text-white/65"
              )}
            >
              {saveStatus === "saving" ? (
                <Loader size={14} color="blue" />
              ) : saveStatus === "error" ? (
                <MdErrorOutline size={17} />
              ) : (
                <MdCheck size={17} />
              )}
              {saveStatus === "saving"
                ? t("savingChanges")
                : saveStatus === "error"
                  ? t("saveFailed")
                  : t("changesSaved")}
            </span>
          ) : undefined
        }
      />

      {settingsError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/80"
        >
          <span>{t("loadError")}</span>
          <button
            type="button"
            onClick={() => void refetchSettings()}
            className="font-semibold text-amber-200 underline underline-offset-4"
          >
            {t("tryAgain")}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="account-card flex min-h-64 items-center justify-center">
          <Loader color="blue" />
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="account-card flex flex-col gap-5 !p-5 sm:!p-6">
            <div className="flex items-start gap-3 border-b border-white/[0.07] pb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.1] text-primary">
                <MdOutlinePalette size={20} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-white">{t("displayRegion")}</h2>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  {t("displayRegionDesc")}
                </p>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-white/[0.06]">
              {/* Theme switching is disabled for now. */}
              {/*
              <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/85">{t("theme")}</p>
                  <p className="mt-1 text-xs text-white/40">{t("themeDescription")}</p>
                </div>
                <div className="flex w-full rounded-xl border border-white/[0.07] bg-black/20 p-1 sm:w-auto">
                  {(["dark", "light"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={theme === option}
                      onClick={() => handleThemeChange(option)}
                      className={clsx(
                        "min-h-9 flex-1 rounded-lg px-4 text-sm font-semibold capitalize transition-colors sm:flex-none",
                        theme === option
                          ? "bg-primary text-white shadow-[0_4px_14px_rgba(77,119,240,0.2)]"
                          : "text-white/45 hover:text-white"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              */}

              <label className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block text-sm font-semibold text-white/85">{t("currency")}</span>
                  <span className="mt-1 block text-xs text-white/40">{t("displayCurrencyDesc")}</span>
                </span>
                <select
                  value={currency}
                  onChange={(event) => handleCurrencyChange(event.target.value)}
                  className="min-h-10 w-full rounded-xl border border-white/[0.08] bg-elevated px-3 text-sm text-white outline-none transition-colors focus:border-primary/60 sm:w-40"
                >
                  {CURRENCIES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block text-sm font-semibold text-white/85">{t("language")}</span>
                  <span className="mt-1 block text-xs text-white/40">{t("languageInterface")}</span>
                </span>
                <select
                  value={language}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  className="min-h-10 w-full rounded-xl border border-white/[0.08] bg-elevated px-3 text-sm text-white outline-none transition-colors focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50 sm:w-40"
                >
                  {locales.map((code) => (
                    <option key={code} value={code}>{localeNames[code]}</option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/85">{t("timezone")}</p>
                  <p className="mt-1 text-xs text-white/40">{t("timezoneDesc")}</p>
                </div>
                <div className="relative w-full sm:w-64" ref={tzDropRef}>
                  <button
                    type="button"
                    aria-expanded={tzDropOpen}
                    onClick={() => setTzDropOpen((open) => !open)}
                    className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-elevated px-3 text-left text-sm text-white outline-none transition-colors hover:border-white/[0.15] focus:border-primary/60"
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate">
                      <MdAccessTime className="shrink-0 text-white/40" size={16} />
                      {selectedTimezoneLabel}
                    </span>
                    <span className={clsx("text-white/40 transition-transform", tzDropOpen && "rotate-180")}>⌄</span>
                  </button>
                  {tzDropOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#181a20] shadow-2xl">
                      <div className="border-b border-white/[0.06] p-2">
                        <input
                          type="search"
                          value={tzSearch}
                          onChange={(event) => setTzSearch(event.target.value)}
                          placeholder={t("searchTimezone")}
                          aria-label={t("searchTimezones")}
                          className="min-h-9 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto p-1">
                        {tzsLoading ? (
                          <div className="flex justify-center py-5"><Loader size="sm" /></div>
                        ) : tzsError ? (
                          <p className="px-3 py-4 text-center text-xs text-red-300">{t("unableTimezones")}</p>
                        ) : filteredTz.length ? (
                          filteredTz.slice(0, 100).map((entry: any) => {
                            const value = tzValue(entry);
                            const label = tzLabel(entry);
                            return (
                              <button
                                key={value || label}
                                type="button"
                                onClick={() => handleTimezoneChange(value)}
                                className={clsx(
                                  "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.05]",
                                  timezone === value && "bg-primary/10 text-primary"
                                )}
                              >
                                {label}
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-3 py-4 text-center text-xs text-white/40">{t("noTimezones")}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <MdOutlineNotificationsActive className="text-primary" size={18} />
              <h2 className="text-sm font-semibold text-white/85">{t("notificationsTrading")}</h2>
              <span className="h-px flex-1 bg-white/[0.07]" />
            </div>

            {preferenceGroups.map((group) => (
              <article key={group.key} className="account-card !p-0">
                <div className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
                  <h3 className="text-sm font-semibold text-white">{t(group.titleKey as "accountNotifications")}</h3>
                  <p className="mt-1 text-xs leading-5 text-white/40">{t(group.descriptionKey as "accountActivityDetail")}</p>
                </div>
                <div className="divide-y divide-white/[0.05] px-4 sm:px-5">
                  {group.options.map((option) => {
                    const enabled = isPreferenceEnabled(group.key, option.key);
                    return (
                      <div key={option.key} className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/80">{t(option.labelKey as "accountActivity")}</p>
                          {"detail" in option && (
                            <p className="mt-0.5 text-xs text-white/40">{option.detail}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={`${t(option.labelKey as "accountActivity")} ${enabled ? t("enabled") : t("disabled")}`}
                          onClick={() => togglePreference(group.key, option.key, enabled)}
                          className={clsx(
                            "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181a20]",
                            enabled ? "bg-primary" : "bg-white/[0.16]"
                          )}
                        >
                          <span
                            className={clsx(
                              "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
                              enabled ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}

export default function SettingsPage() {
  return (
    <PageSuspense fallback={<AccountSettingsSkeleton />}>
      <SettingsPageInner />
    </PageSuspense>
  );
}
