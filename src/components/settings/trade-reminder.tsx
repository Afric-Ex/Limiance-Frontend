"use client";

import { Checkbox, CheckboxGroup } from "@mantine/core";
import { modals } from "@mantine/modals";
import { ModalClose } from "../icons/modal-close";

const reminders = [
  "Limit Order",
  "Market Order",
  "Stop-Limit Order",
  "Auto Borrow/Repay for Margin",
  "Select All",
];

export const TradeReminder = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold">
          Trade ( Order Confirmation Reminder)
        </h4>
        <ModalClose onClick={() => modals.closeAll()} />
      </div>
      <div className="flex flex-col gap-16">
        <CheckboxGroup>
          <div className="flex flex-col gap-6">
            {reminders.map((item) => (
              <Checkbox
                key={item}
                classNames={{ input: "!bg-transparent !border-white" }}
                labelPosition="right"
                label={item}
                value={item}
              />
            ))}
          </div>
        </CheckboxGroup>
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
