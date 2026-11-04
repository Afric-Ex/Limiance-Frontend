"use client";

import { Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { ModalClose } from "../icons/modal-close";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tantml:react-query";
import { userKeys, userService } from "@/src/services/user";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const settings = [
  {
    key: "useBNBToPayFees",
    title: "Use BNB to pay fees",
    desc: "Enjoy 25% discount",
  },
  {
    key: "useBNBToPayMarginFees",
    title: "Use BNB to pay Margin interests",
    desc: "Enjoy 5% discount",
  },
  {
    key: "useBNBToPayFuturesFees",
    title: "Use BNB to pay USDⓈ-M Futures fees",
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
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold">Trade ( Fee Deduction )</h4>
        <ModalClose onClick={() => modals.closeAll()} />
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          {settings.map(({ key, title, desc }) => {
            const isOn = tradeFeeDeductions[key as keyof typeof tradeFeeDeductions];
            return (
              <div
                key={key}
                className="p-5 gap-11px flex justify-between items-center border-gray-9/40 border rounded-20px"
              >
                <div className="flex flex-col gap-13px">
                  <span className="text-base font-medium">{title}</span>
                  <span className="text-xs text-gray-9">{desc}</span>
                </div>
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
            onClick={() => saveFeeDeductions()}
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
