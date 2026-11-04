"use client";

import { Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { ModalClose } from "../icons/modal-close";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const reminders = [
  { key: "limitOrder", label: "Limit Order" },
  { key: "marketOrder", label: "Market Order" },
  { key: "stopOrder", label: "Stop-Limit Order" },
  { key: "autoBorrowRepayMargin", label: "Auto Borrow/Repay for Margin" },
];

export const TradeReminder = () => {
  const queryClient = useQueryClient();
  
  // Fetch current settings from backend
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: userKeys.settings,
    queryFn: () => userService.getSettings(),
    select: (res: any) => res.data ?? res,
  });

  const [tradeOrdersReminder, setTradeOrdersReminder] = useState({
    autoBorrowRepayMargin: false,
    limitOrder: false,
    marketOrder: false,
    stopOrder: false,
  });

  // Initialize from backend data
  useEffect(() => {
    if (settingsData?.tradeOrdersNotificationReminder) {
      setTradeOrdersReminder(settingsData.tradeOrdersNotificationReminder);
    }
  }, [settingsData]);

  const toggle = (key: string) => {
    setTradeOrdersReminder((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const toggleAll = () => {
    const allValues = Object.values(tradeOrdersReminder);
    const allEnabled = allValues.every((v) => v === true);
    const newState: Record<string, boolean> = {};
    reminders.forEach((r) => {
      newState[r.key] = !allEnabled;
    });
    setTradeOrdersReminder(newState as typeof tradeOrdersReminder);
  };

  const isAllSelected = Object.values(tradeOrdersReminder).every((v) => v === true);

  const { mutate: saveReminders, isPending } = useMutation({
    mutationFn: (): Promise<any> =>
      userService.updateSettings({ tradeOrdersNotificationReminder: tradeOrdersReminder }),
    onSuccess: () => {
      successNotification("Trade reminders updated");
      queryClient.invalidateQueries({ queryKey: userKeys.settings });
      modals.closeAll();
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader color="blue" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold">
          Trade ( Order Confirmation Reminder)
        </h4>
        <ModalClose onClick={() => modals.closeAll()} />
      </div>
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-6">
          {/* Select All */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-9/40">
            <span className="text-base font-medium">Select All</span>
            <button
              onClick={toggleAll}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isAllSelected ? "bg-primary" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  isAllSelected ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
          
          {reminders.map(({ key, label }) => {
            const isOn = tradeOrdersReminder[key as keyof typeof tradeOrdersReminder];
            return (
              <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-gray-9/40">
                <span className="text-base font-medium">{label}</span>
                <button
                  onClick={() => toggle(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isOn ? "bg-primary" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      isOn ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => modals.closeAll()}
            className="bg-gray-9 rounded-xl py-18px text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => saveReminders()}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 rounded-xl py-18px text-base font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader size="xs" color="white" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
