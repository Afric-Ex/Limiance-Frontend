"use client";

import { Switch } from "@mantine/core";
import { modals } from "@mantine/modals";
import { ModalClose } from "../icons/modal-close";

const settings = [
  "Futures trading notifications",
  "Futures notification sounds",
  "Spot trading notifications",
  "Spot notification sounds",
];

export const TransactionNotifications = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold">Transaction Notifications</h4>
        <ModalClose onClick={() => modals.closeAll()} />
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          {settings.map((item) => (
            <div
              key={item}
              className="p-5 gap-11px flex justify-between items-center border-gray-9/40 border rounded-20px"
            >
              <span className="text-base font-medium">{item}</span>
              <Switch />
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
