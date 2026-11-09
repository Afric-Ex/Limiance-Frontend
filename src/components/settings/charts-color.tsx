"use client";

import { Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { MdOutlineClose, MdOutlineShowChart } from "react-icons/md";
import { PriceTrend } from "../icons/price-trend";
import { PriceTrend2 } from "../icons/price-trend-2";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const chartType = [
  {
    text: "Green Up / Red Down",
    icon: <PriceTrend />,
    greenUp: true,
  },
  {
    text: "Red Up / Green Down",
    icon: <PriceTrend2 />,
    greenUp: false,
  },
];

export const ChartsColor = () => {
  const queryClient = useQueryClient();
  
  // Fetch current settings from backend
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: userKeys.settings,
    queryFn: () => userService.getSettings(),
    select: (res: any) => res.data ?? res,
  });

  // chartColor: true = Green Up/Red Down, false = Red Up/Green Down
  const [chartColor, setChartColor] = useState(false);

  // Initialize from backend data
  useEffect(() => {
    if (settingsData?.chartColor !== undefined) {
      setChartColor(settingsData.chartColor);
    }
  }, [settingsData]);

  const { mutate: saveChartColor, isPending } = useMutation({
    mutationFn: (): Promise<any> =>
      userService.updateSettings({ chartColor }),
    onSuccess: () => {
      successNotification("Chart color updated");
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
            <MdOutlineShowChart size={22} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-[var(--text-title)] font-bold text-[var(--color-text-primary)]">Charts Color</h4>
            <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">Choose your preferred candlestick colors</p>
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

      <div className="flex flex-col gap-3">
        {chartType.map(({ text, icon, greenUp }) => (
          <button
            key={text}
            onClick={() => setChartColor(greenUp)}
            className={clsx(
              "p-4 flex flex-col gap-4 border rounded-xl cursor-pointer transition-all text-left",
              chartColor === greenUp
                ? "bg-primary/[0.06] border-primary/40 ring-1 ring-primary/20"
                : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.10]"
            )}
          >
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-[var(--text-body)] font-semibold text-[var(--color-text-primary)]">{text}</span>
              </div>
              {chartColor === greenUp && (
                <span className="text-primary text-[var(--text-caption)] font-bold px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
                  Selected
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3 pl-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/[0.08]" />
                  <span className="w-20 h-4 rounded-md bg-white/[0.08]" />
                </div>
                <span
                  className={clsx(
                    greenUp ? "text-buy" : "text-sell",
                    "text-[var(--text-body)] font-semibold tabular-nums"
                  )}
                >
                  +3.12%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/[0.08]" />
                  <span className="w-20 h-4 rounded-md bg-white/[0.08]" />
                </div>
                <span
                  className={clsx(
                    greenUp ? "text-sell" : "text-buy",
                    "text-[var(--text-body)] font-semibold tabular-nums"
                  )}
                >
                  −1.12%
                </span>
              </div>
            </div>
          </button>
        ))}
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
          onClick={() => saveChartColor()}
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
