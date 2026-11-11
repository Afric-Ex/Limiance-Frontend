"use client";

import { Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { MdOutlineClose, MdOutlineNotificationsActive } from "react-icons/md";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { buildSettingsPayload } from "@/src/lib/user-settings";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const preference = [
  { key: "activities", label: "Activities", description: "Trade executions, deposits, withdrawals" },
  { key: "tradeNotification", label: "Trade Notifications", description: "Order fills, price alerts, P2P updates" },
  { key: "news", label: "Limiance News", description: "Platform announcements and new listings" },
  { key: "systemMessages", label: "System Messages", description: "Security alerts and account notices" },
];

export const NotificationPreference = () => {
  const queryClient = useQueryClient();
  
  // Fetch current settings from backend
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: userKeys.settings,
    queryFn: () => userService.getSettings(),
    select: (res: any) => res.data ?? res,
  });

  const [selected, setSelected] = useState<Record<string, boolean>>({
    activities: false,
    tradeNotification: false,
    news: false,
    systemMessages: false,
  });

  // Initialize from backend data
  useEffect(() => {
    if (settingsData?.notificationPreference) {
      setSelected(settingsData.notificationPreference);
    }
  }, [settingsData]);

  const toggle = (key: string) => {
    setSelected((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAll = () => {
    const allValues = Object.values(selected);
    const allEnabled = allValues.every((v) => v === true);
    const newState: Record<string, boolean> = {};
    preference.forEach((p) => {
      newState[p.key] = !allEnabled;
    });
    setSelected(newState);
  };

  const isAllSelected = Object.values(selected).every((v) => v === true);

  const { mutate: saveNotifications, isPending } = useMutation({
    mutationFn: (): Promise<any> =>
      userService.updateSettings(
        buildSettingsPayload(settingsData, { notificationPreference: selected })
      ),
    onSuccess: () => {
      successNotification("Notification preferences saved");
      queryClient.invalidateQueries({ queryKey: userKeys.settings });
      modals.closeAll();
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  if (settingsLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <Loader color="blue" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <MdOutlineNotificationsActive size={22} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-[var(--text-title)] font-bold text-[var(--color-text-primary)]">Notification Preferences</h4>
            <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">Manage your notification settings</p>
          </div>
        </div>
        <button
          onClick={() => modals.closeAll()}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-all active:scale-95 text-white/60 hover:text-white shrink-0"
        >
          <MdOutlineClose size={18} />
        </button>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div className="flex flex-col gap-2">
        {/* Select All Row */}
        <button
          onClick={toggleAll}
          className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all cursor-pointer group ${
            isAllSelected
              ? "bg-primary/[0.08] border-primary/40"
              : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.10]"
          }`}
        >
          <span className={`text-[var(--text-body)] font-semibold ${isAllSelected ? "text-primary" : "text-white/70"}`}>
            {isAllSelected ? "Deselect All" : "Select All"}
          </span>
          <div className={`w-11 h-6 shrink-0 rounded-full relative transition-colors duration-200 ${
            isAllSelected ? "bg-primary-strong" : "bg-white/[0.12]"
          }`}>
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              isAllSelected ? "translate-x-5" : "translate-x-0"
            }`} />
          </div>
        </button>

        <div className="h-px bg-white/[0.04] my-2" />

        {preference.map((item) => {
          const isOn = selected[item.key] || false;
          return (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all cursor-pointer group ${
                isOn
                  ? "bg-primary/[0.05] border-primary/25 hover:border-primary/40"
                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.10]"
              }`}
            >
              <div className="flex flex-col items-start gap-1">
                <span className={`text-[var(--text-body)] font-semibold ${isOn ? "text-[var(--color-text-primary)]" : "text-white/70"}`}>
                  {item.label}
                </span>
                <span className="text-[var(--text-caption)] text-[var(--color-text-secondary)] font-normal text-left leading-tight">{item.description}</span>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0 ml-4 ${
                isOn ? "bg-primary-strong" : "bg-white/[0.12]"
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  isOn ? "translate-x-5" : "translate-x-0"
                }`} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-white/[0.06] mt-2" />

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => modals.closeAll()}
          className="h-[var(--size-input-standard)] rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[var(--color-text-primary)] font-semibold text-[var(--text-body)] transition-all active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          onClick={() => saveNotifications()}
          disabled={isPending}
          className="h-[var(--size-input-standard)] rounded-xl bg-primary-strong hover:bg-primary hover:shadow-[var(--shadow-glow-primary)] text-white font-semibold text-[var(--text-body)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader size="xs" color="white" />}
          Save Preferences
        </button>
      </div>
    </div>
  );
};
