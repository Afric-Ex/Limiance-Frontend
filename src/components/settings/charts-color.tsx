"use client";

import { modals } from "@mantine/modals";
import { ModalClose } from "../icons/modal-close";
import { PriceTrend } from "../icons/price-trend";
import { PriceTrend2 } from "../icons/price-trend-2";
import clsx from "clsx";

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
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold">Charts Color</h4>
        <ModalClose onClick={() => modals.closeAll()} />
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          {chartType.map(({ text, icon, greenUp }) => (
            <div
              key={text}
              className="p-5 gap-5 flex hover:border-gray-9 border-transparent cursor-pointer flex-col bg-gray-9/15 border rounded-2xl"
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-semibold">{text}</span>
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
            </div>
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
            className="bg-gray-9 rounded-xl disabled:text-white/20 py-18px text-base font-medium disabled:bg-gray-9"
            disabled
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
