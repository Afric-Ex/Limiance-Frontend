"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
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

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "USDT"];

type SaveStatus = "idle" | "saving" | "saved" | "error";

const preferenceGroups = [
  {
    key: "notificationPreference",
    title: "Account notifications",
    description: "Account activity and important platform updates.",
    options: [
      { key: "activities", label: "Account activity", detail: "Deposits, withdrawals and account events" },
      { key: "tradeNotification", label: "Trade updates", detail: "Order fills and P2P activity" },
      { key: "news", label: "Product news", detail: "Announcements and new listings" },
      { key: "systemMessages", label: "System messages", detail: "Security alerts and account notices" },
    ],
  },
  {
    key: "priceAlerts",
    title: "Price alerts",
    description: "Control price notifications across your watchlist.",
    options: [
      { key: "priceOn", label: "Price alerts", detail: "Notify me when an alert is triggered" },
      { key: "notificationOn", label: "Alert notifications", detail: "Show price alerts in the app" },
    ],
  },
  {
    key: "transactionNotifications",
    title: "Trading notifications",
    description: "Choose which market activity notifications are enabled.",
    options: [
      { key: "spotTradingNotification", label: "Spot trading", detail: "Spot order activity" },
      { key: "spotNotificationSound", label: "Spot sounds", detail: "Play sounds for spot activity" },
      { key: "futuresTradingNotification", label: "Futures trading", detail: "Futures order activity" },
      { key: "futuresNotificationSound", label: "Futures sounds", detail: "Play sounds for futures activity" },
    ],
  },
  {
    key: "tradeOrdersNotificationReminder",
    title: "Order confirmations",
    description: "Get a reminder before submitting selected order types.",
    options: [
      { key: "limitOrder", label: "Limit orders" },
      { key: "marketOrder", label: "Market orders" },
      { key: "stopOrder", label: "Stop orders" },
      { key: "autoBorrowRepayMargin", label: "Margin borrow and repay" },
    ],
  },
  {
    key: "tradeFeeDeductions",
    title: "Fee deductions",
    description: "Choose whether to use LIM to pay eligible trading fees.",
    options: [
      { key: "useBNBToPayFees", label: "Spot trading fees" },
      { key: "useBNBToPayMarginFees", label: "Margin fees" },
      { key: "useBNBToPayFuturesFees", label: "Futures fees" },
    ],
  },
] as const;

function SettingsPageInner() {
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

  // Load languages
  const { data: languages, isLoading: langsLoading, isError: langsError } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const res = await api.get("/languages");
      return res.data?.data ?? res.data ?? [];
    },
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [tzSearch, setTzSearch] = useState("");
  const [tzDropOpen, setTzDropOpen] = useState(false);
  const tzDropRef = useRef<HTMLDivElement>(null);

  // Seed from API
  useEffect(() => {
    if (!settings) return;
    if (settings.theme) setTheme(settings.theme);
    if (settings.currency) setCurrency(settings.currency);
    if (settings.language) setLanguage(settings.language);
    if (settings.timezone) setTimezone(settings.timezone);
    prevValuesRef.current = {
      theme: settings.theme ?? "dark",
      currency: settings.currency ?? "USD",
      language: settings.language ?? "en",
      timezone: settings.timezone ?? "UTC",
    };
  }, [settings]);

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
      setTheme(prevValuesRef.current.theme ?? "dark");
      setCurrency(prevValuesRef.current.currency ?? "USD");
      setLanguage(prevValuesRef.current.language ?? "en");
      setTimezone(prevValuesRef.current.timezone ?? "UTC");
    },
  });

  const debouncedSave = useCallback((data: Record<string, any>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(() => {
      saveSettings(data);
      setTimeout(() => setSaveStatus("idle"), 2500);
    }, 500);
  }, [saveSettings]);

  const handleThemeChange = (val: "dark" | "light") => {
    setTheme(val);
    debouncedSave({ theme: val, currency, language, timezone });
  };

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    debouncedSave({ theme, currency: val, language, timezone });
  };

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    debouncedSave({ theme, currency, language: val, timezone });
  };

  const handleTimezoneChange = (val: string) => {
    setTimezone(val);
    setTzDropOpen(false);
    setTzSearch("");
    debouncedSave({ theme, currency, language, timezone: val });
  };

  const togglePreference = (group: string, key: string, enabled: boolean) => {
    setSaveStatus("saving");
    const currentGroup = settings?.[group as keyof typeof settings];
    if (!currentGroup || typeof currentGroup !== "object") return;
    saveSettings({
      [group]: {
        ...currentGroup,
        [key]: !enabled,
      },
    });
  };

  const filteredTz = (timezones ?? []).filter((tz: any) =>
    (typeof tz === "string" ? tz : tz.label ?? tz.name ?? tz.value ?? "").toLowerCase().includes(tzSearch.toLowerCase())
  );

  const tzLabel = (tz: any) => typeof tz === "string" ? tz : tz.label ?? tz.name ?? tz.value ?? "";

  const isLoading = settingsLoading;
  const isPreferenceEnabled = (group: string, key: string) =>
    Boolean((settings as any)?.[group]?.[key]);

  return (
    <main className="page-enter mx-auto flex w-full max-w-[1180px] flex-col gap-5 pb-8 max-[1150px]:pb-[100px]">
      <AccountPageHeader
        title="Account settings"
        description="Personalize how Limiance looks, keeps you informed, and displays your trading activity."
        icon={<MdOutlineSettings size={23} />}
        eyebrow="Preferences"
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
                ? "Saving changes"
                : saveStatus === "error"
                  ? "Save failed"
                  : "Changes saved"}
            </span>
          ) : undefined
        }
      />

      {settingsError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/80"
        >
          <span>We couldn’t load your saved preferences.</span>
          <button
            type="button"
            onClick={() => void refetchSettings()}
            className="font-semibold text-amber-200 underline underline-offset-4"
          >
            Try again
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
                <h2 className="text-base font-semibold text-white">Display & region</h2>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Set the appearance and regional formats used across your account.
                </p>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-white/[0.06]">
              <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/85">Theme</p>
                  <p className="mt-1 text-xs text-white/40">Choose your preferred colour scheme.</p>
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

              <label className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block text-sm font-semibold text-white/85">Display currency</span>
                  <span className="mt-1 block text-xs text-white/40">Currency used to show prices and balances.</span>
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
                  <span className="block text-sm font-semibold text-white/85">Language</span>
                  <span className="mt-1 block text-xs text-white/40">Language used across the interface.</span>
                </span>
                <select
                  value={language}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  disabled={langsLoading || langsError}
                  className="min-h-10 w-full rounded-xl border border-white/[0.08] bg-elevated px-3 text-sm text-white outline-none transition-colors focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50 sm:w-40"
                >
                  {langsLoading ? (
                    <option value={language}>Loading languages…</option>
                  ) : Array.isArray(languages) && languages.length > 0 ? (
                    languages.map((entry: any) => {
                      const value = typeof entry === "string" ? entry : entry.code ?? entry.value ?? entry.id;
                      const label = typeof entry === "string" ? entry : entry.name ?? entry.label ?? value;
                      return <option key={value} value={value}>{label}</option>;
                    })
                  ) : (
                    <>
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="pt">Portuguese</option>
                      <option value="zh">Chinese</option>
                    </>
                  )}
                </select>
              </label>

              <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/85">Timezone</p>
                  <p className="mt-1 text-xs text-white/40">Timezone used to display dates and times.</p>
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
                      {timezone}
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
                          placeholder="Search timezone"
                          aria-label="Search timezones"
                          className="min-h-9 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto p-1">
                        {tzsLoading ? (
                          <div className="flex justify-center py-5"><Loader size="sm" /></div>
                        ) : tzsError ? (
                          <p className="px-3 py-4 text-center text-xs text-red-300">Unable to load timezones.</p>
                        ) : filteredTz.length ? (
                          filteredTz.slice(0, 100).map((entry: any) => {
                            const label = tzLabel(entry);
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => handleTimezoneChange(label)}
                                className={clsx(
                                  "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.05]",
                                  timezone === label && "bg-primary/10 text-primary"
                                )}
                              >
                                {label}
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-3 py-4 text-center text-xs text-white/40">No matching timezones.</p>
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
              <h2 className="text-sm font-semibold text-white/85">Notifications & trading</h2>
              <span className="h-px flex-1 bg-white/[0.07]" />
            </div>

            {preferenceGroups.map((group) => (
              <article key={group.key} className="account-card !p-0">
                <div className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
                  <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-white/40">{group.description}</p>
                </div>
                <div className="divide-y divide-white/[0.05] px-4 sm:px-5">
                  {group.options.map((option) => {
                    const enabled = isPreferenceEnabled(group.key, option.key);
                    return (
                      <div key={option.key} className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/80">{option.label}</p>
                          {"detail" in option && (
                            <p className="mt-0.5 text-xs text-white/40">{option.detail}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={`${option.label} ${enabled ? "enabled" : "disabled"}`}
                          onClick={() => togglePreference(group.key, option.key, enabled)}
                          className={clsx(
                            "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181a20]",
                            enabled ? "bg-primary" : "bg-white/[0.16]"
                          )}
                        >
                          <span
                            className={clsx(
                              "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
                              enabled ? "translate-x-6" : "translate-x-1"
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
