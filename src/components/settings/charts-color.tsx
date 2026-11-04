"use client";

import { Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { ModalClose } from "../icons/modal-close";
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
    text: "Green Up / Red down",
    icon: <PriceTrend />,
    greenUp: true,
  },
  {
    text: "Red Up / Green down",
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
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold">Charts Color</h4>
        <ModalClose onClick={() => modals.closeAll()} />
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          {chartType.map(({ text, icon, greenUp }) => (
            <button
              key={text}
              onClick={() => setChartColor(greenUp)}
              className={clsx(
                "p-5 gap-5 flex flex-col border rounded-2xl cursor-pointer transition-all",
                chartColor === greenUp
                  ? "bg-primary/10 border-primary"
                  : "bg-gray-9/15 border-transparent hover:border-gray-9"
              )}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-semibold">{text}</span>
                {chartColor === greenUp && (
                  <span className="ml-auto text-primary text-xs font-bold">Selected</span>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-9/20" />
                    <span className="w-94px h-5 rounded-md bg-gray-9/20" />
                  </div>
                  <span
                    className={clsx(
                      greenUp ? "text-success-5" : "text-error-1",
                      "text-sm font-semibold"
                    )}
                  >
                    +3.12%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-9/20" />
                    <span className="w-94px h-5 rounded-md bg-gray-9/20" />
                  </div>
                  <span
                    className={clsx(
                      greenUp ? "text-error-1" : "text-success-5",
                      "text-sm font-semibold"
                    )}
                  >
                    -1.12%
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => modals.closeAll()}
            className="bg-gray-9 rounded-xl py-18px text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => saveChartColor()}
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
