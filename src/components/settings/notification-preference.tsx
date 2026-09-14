"use client";

import { Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { MdOutlineClose, MdOutlineNotificationsActive } from "react-icons/md";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MOCK_MODE } from "@/src/mocks";
import { mockUser } from "@/src/mocks/mock-user";
import { userKeys, userService } from "@/src/services/user";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const preference = [
  { key: "Activities", label: "Activities", description: "Trade executions, deposits, withdrawals" },
  { key: "Trade Notification", label: "Trade Notifications", description: "Order fills, price alerts, P2P updates" },
  { key: "Limiance News", label: "Limiance News", description: "Platform announcements and new listings" },
  { key: "System Messages", label: "System Messages", description: "Security alerts and account notices" },
];

export const NotificationPreference = () => {
  const [selected, setSelected] = useState<string[]>(["Activities", "Trade Notification", "Limiance News", "System Messages"]);
  const queryClient = useQueryClient();

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    const allKeys = preference.map((p) => p.key);
    setSelected((prev) => (prev.length === allKeys.length ? [] : allKeys));
  };

  const isAllSelected = selected.length === preference.length;

  const { mutate: saveNotifications, isPending } = useMutation({
    mutationFn: (): Promise<any> =>
      MOCK_MODE.settings
        ? mockUser.saveSettings({ notificationPreference: { activities: selected.includes("Activities"), tradeNotification: selected.includes("Trade Notification"), news: selected.includes("Limiance News"), systemMessages: selected.includes("System Messages") } })
        : userService.saveSettings({ notificationPreference: selected }),
    onSuccess: () => {
      successNotification("Notification preferences saved");
      queryClient.invalidateQueries({ queryKey: userKeys.settings });
      modals.closeAll();
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  return (
    <div className="w-full max-w-[480px] flex flex-col gap-6 bg-[#181a20] rounded-2xl p-8 border border-white/[0.06]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
            <MdOutlineNotificationsActive size={20} />
          </div>
          <h4 className="text-xl font-bold text-white">Notification Preferences</h4>
        </div>
        <button
          onClick={() => modals.closeAll()}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
        >
          <MdOutlineClose size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Select All Row */}
        <button
          onClick={toggleAll}
          className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${
            isAllSelected
              ? "bg-primary/[0.06] border-primary/30"
              : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
          }`}
        >
          <span className={`text-sm font-bold ${isAllSelected ? "text-primary" : "text-white/60"}`}>
            {isAllSelected ? "Deselect All" : "Select All"}
          </span>
          <div className={`w-11 h-6 rounded-full relative transition-all duration-300 ${
            isAllSelected ? "bg-primary" : "bg-white/[0.08]"
          }`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
              isAllSelected ? "left-6" : "left-1"
            }`} />
          </div>
        </button>

        <div className="h-px bg-white/[0.06] my-1" />

        {preference.map((item) => {
          const isOn = selected.includes(item.key);
          return (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${
                isOn
                  ? "bg-primary/[0.04] border-primary/20 hover:border-primary/40"
                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className={`text-sm font-semibold ${isOn ? "text-white" : "text-white/60"}`}>
                  {item.label}
                </span>
                <span className="text-xs text-white/30 font-medium text-left">{item.description}</span>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ml-4 ${
                isOn ? "bg-primary" : "bg-white/[0.08]"
              }`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                  isOn ? "left-6" : "left-1"
                }`} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <button
          onClick={() => modals.closeAll()}
          className="h-[52px] rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white font-bold text-sm transition-all active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          onClick={() => saveNotifications()}
          disabled={isPending}
          className="h-[52px] rounded-xl bg-primary hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(77,119,240,0.3)] text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending && <Loader size="xs" color="white" />}
          Save Preferences
        </button>
      </div>
    </div>
  );
};
