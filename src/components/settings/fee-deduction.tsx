"use client";

import { Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { MdOutlineClose, MdOutlineAccountBalanceWallet } from "react-icons/md";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const settings = [
  {
    title: "Use LIM to pay fees",
    desc: "Enjoy 25% discount",
  },
  {
    title: "Use LIM to pay Margin interests",
    desc: "Enjoy 5% discount",
  },
  {
    title: "Use LIM to pay USDⓈ-M Futures fees",
    desc: "Enjoy 10% discount",
  },
];

export const FeeDeduction = () => {
  const queryClient = useQueryClient();
  
  // Fetch current settings from backend
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: userKeys.settings,
    queryFn: () => userService.getSettings(),
    select: (res: any) => res.data ?? res,
  });

  const [tradeFeeDeductions, setTradeFeeDeductions] = useState({
    useBNBToPayFees: false,
    useBNBToPayFuturesFees: false,
    useBNBToPayMarginFees: false,
  });

  // Initialize from backend data
  useEffect(() => {
    if (settingsData?.tradeFeeDeductions) {
      setTradeFeeDeductions(settingsData.tradeFeeDeductions);
    }
  }, [settingsData]);

  const toggle = (key: string) => {
    setTradeFeeDeductions((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const { mutate: saveFeeDeductions, isPending } = useMutation({
    mutationFn: (): Promise<any> =>
      userService.updateSettings({ tradeFeeDeductions }),
    onSuccess: () => {
      successNotification("Fee deduction settings updated");
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <MdOutlineAccountBalanceWallet size={22} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-[var(--text-title)] font-bold text-[var(--color-text-primary)]">Fee Deduction</h4>
            <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">Use BNB to reduce trading costs</p>
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
        {settings.map(({ key, title, desc }) => {
          const isOn = tradeFeeDeductions[key as keyof typeof tradeFeeDeductions];
          return (
            <div
              key={key}
              className="px-4 py-3.5 flex justify-between items-start border-white/[0.06] border rounded-xl bg-white/[0.02] hover:border-white/[0.10] transition-all"
            >
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[var(--text-body)] font-semibold text-[var(--color-text-primary)]">{title}</span>
                <span className="text-[var(--text-caption)] text-[var(--color-text-secondary)] leading-tight">{desc}</span>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${
                  isOn ? "bg-primary-strong" : "bg-white/[0.12]"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                    isOn ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
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
          onClick={() => saveFeeDeductions()}
          disabled={isPending}
          className="h-[var(--size-input-standard)] rounded-xl bg-primary-strong hover:bg-primary hover:shadow-[var(--shadow-glow-primary)] text-white font-semibold text-[var(--text-body)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader size="xs" color="white" />}
          Save Changes
        </button>
      </div>
    </div>
  );
};
