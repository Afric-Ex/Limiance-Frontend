"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { api } from "@/src/lib/axios";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader } from "@mantine/core";
import { MdCheck } from "react-icons/md";
import clsx from "clsx";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountSettingsSkeleton } from "@/src/components/skeletons/account";

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "USDT"];

type SaveStatus = "idle" | "saving" | "saved" | "error";

function SettingsPageInner() {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevValuesRef = useRef<Record<string, any>>({});

  // Load settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: userKeys.settings,
    queryFn: () => userService.getSettings(),
    select: (res: any) => res.data ?? res,
  });

  // Load languages
  const { data: languages, isLoading: langsLoading } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const res = await api.get("/languages");
      return res.data?.data ?? res.data ?? [];
    },
  });

  // Load timezones
  const { data: timezones, isLoading: tzsLoading } = useQuery({
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
    prevValuesRef.current = { theme: settings.theme ?? "dark", currency: settings.currency ?? "USD", language: settings.language ?? "en" };
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
    onSuccess: () => setSaveStatus("saved"),
    onError: (e: any) => {
      errorMessageHandler(e);
      setSaveStatus("error");
      // revert to previous values
      setTheme(prevValuesRef.current.theme ?? "dark");
      setCurrency(prevValuesRef.current.currency ?? "USD");
      setLanguage(prevValuesRef.current.language ?? "en");
    },
  });

  const debouncedSave = useCallback((data: Record<string, any>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(() => {
      prevValuesRef.current = data;
      saveSettings(data);
      setTimeout(() => setSaveStatus("idle"), 2500);
    }, 500);
  }, [saveSettings]);

  const handleThemeChange = (val: "dark" | "light") => {
    setTheme(val);
    debouncedSave({ theme: val, currency, language });
  };

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    debouncedSave({ theme, currency: val, language });
  };

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    debouncedSave({ theme, currency, language: val });
  };

  const filteredTz = (timezones ?? []).filter((tz: any) =>
    (typeof tz === "string" ? tz : tz.label ?? tz.name ?? tz.value ?? "").toLowerCase().includes(tzSearch.toLowerCase())
  );

  const tzLabel = (tz: any) => typeof tz === "string" ? tz : tz.label ?? tz.name ?? tz.value ?? "";

  const isLoading = settingsLoading;

  return (
    <main className="flex flex-col gap-8 max-[1150px]:gap-4 max-w-3xl max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Preferences</h1>
          <p className="text-sm text-white/50">Customise your trading experience.</p>
        </div>
        {/* Saved Indicator */}
        <div className={clsx("flex items-center gap-1.5 text-sm font-medium transition-all duration-300", saveStatus === "saved" ? "opacity-100 text-success-6" : "opacity-0 text-success-6")}>
          {saveStatus === "saving" ? <Loader size={14} color="blue" /> : <MdCheck size={18} />}
          {saveStatus === "saving" ? "Saving…" : "Saved"}
        </div>
      </div>

      {/* Section A — Display Preferences */}
      <div className="p-8 max-[1150px]:p-4 bg-primary/10 border border-primary/25 rounded-20px max-[1150px]:rounded-xl backdrop-blur-8px flex flex-col gap-6 max-[1150px]:gap-4">

        {isLoading ? (
          <div className="flex justify-center py-6"><Loader color="blue" /></div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Theme */}
            <div className="flex items-center justify-between max-[1150px]:flex-col max-[1150px]:items-start max-[1150px]:gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Theme</span>
                <span className="text-xs text-white/50">Choose your preferred colour scheme</span>
              </div>
              <div className="flex items-center gap-1 p-1 bg-black/30 border border-white/[0.08] rounded-xl max-[1150px]:w-full max-[1150px]:justify-between">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={clsx(
                      "px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                      theme === t ? "bg-primary text-white shadow-md" : "text-white/50 hover:text-white"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/[0.05]" />

            {/* Display Currency */}
            <div className="flex items-center justify-between max-[1150px]:flex-col max-[1150px]:items-start max-[1150px]:gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Display Currency</span>
                <span className="text-xs text-white/50">Prices and balances shown in this currency</span>
              </div>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-gray-1 border border-gray-9/40 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors cursor-pointer max-[1150px]:w-full"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="h-px bg-white/[0.05]" />

            {/* Language */}
            <div className="flex items-center justify-between max-[1150px]:flex-col max-[1150px]:items-start max-[1150px]:gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Language</span>
                <span className="text-xs text-white/50">Interface display language</span>
              </div>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={langsLoading}
                className="bg-gray-1 border border-gray-9/40 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors cursor-pointer disabled:opacity-50 max-[1150px]:w-full"
              >
                {langsLoading ? (
                  <option>Loading…</option>
                ) : (languages ?? []).length > 0 ? (
                  (languages ?? []).map((l: any) => {
                    const val = typeof l === "string" ? l : l.code ?? l.value ?? l.id ?? l;
                    const lbl = typeof l === "string" ? l : l.name ?? l.label ?? val;
                    return <option key={val} value={val}>{lbl}</option>;
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
            </div>

            <div className="h-px bg-white/[0.05]" />

            {/* Timezone — searchable dropdown */}
            <div className="flex items-center justify-between gap-4 flex-wrap max-[1150px]:flex-col max-[1150px]:items-start">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Timezone</span>
                <span className="text-xs text-white/50">Used for displaying dates and times</span>
              </div>

              <div className="relative min-w-[220px] max-[1150px]:w-full" ref={tzDropRef}>
                <button
                  onClick={() => setTzDropOpen(!tzDropOpen)}
                  className="w-full flex items-center justify-between gap-2 bg-gray-1 border border-gray-9/40 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors cursor-pointer hover:border-white/40"
                >
                  <span className="truncate">{timezone}</span>
                  <svg className={clsx("w-4 h-4 text-white/40 transition-transform shrink-0", tzDropOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                {tzDropOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-gray-7 border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-white/[0.06]">
                      <input
                        type="text"
                        value={tzSearch}
                        onChange={(e) => setTzSearch(e.target.value)}
                        placeholder="Search timezone…"
                        className="w-full px-3 py-2 bg-black/30 border border-white/[0.08] rounded-lg text-sm text-white outline-none focus:border-primary transition-colors"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {tzsLoading ? (
                        <div className="flex justify-center py-4"><Loader size="sm" /></div>
                      ) : filteredTz.length > 0 ? (
                        filteredTz.slice(0, 50).map((tz: any) => {
                          const label = tzLabel(tz);
                          return (
                            <button
                              key={label}
                              onClick={() => { setTimezone(label); setTzDropOpen(false); setTzSearch(""); }}
                              className={clsx("w-full px-4 py-2.5 text-left text-sm hover:bg-primary/10 transition-colors", timezone === label && "text-primary bg-primary/10")}
                            >
                              {label}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-white/40 text-center py-4">No timezones found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section B — Notifications (conditional) */}
      {settings && Object.keys(settings).some((k) => k.toLowerCase().includes("notif") || k.toLowerCase().includes("alert") || k.toLowerCase().includes("email")) && (
        <div className="p-8 max-[1150px]:p-4 bg-primary/10 border border-primary/25 rounded-20px max-[1150px]:rounded-xl backdrop-blur-8px flex flex-col gap-6 max-[1150px]:gap-4">
          <div className="flex flex-col gap-4">
            {Object.entries(settings)
              .filter(([k]) => k.toLowerCase().includes("notif") || k.toLowerCase().includes("alert") || k.toLowerCase().includes("email"))
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-sm capitalize">{key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}</span>
                  <button
                    onClick={() => {
                      debouncedSave({ [key]: !value });
                    }}
                    className={clsx("relative w-11 h-6 rounded-full transition-colors", value ? "bg-primary" : "bg-white/20")}
                  >
                    <span className={clsx("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all", value ? "left-6" : "left-1")} />
                  </button>
                </div>
              ))}
          </div>
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
