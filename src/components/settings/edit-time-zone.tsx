"use client";

import { Loader, Radio, RadioGroup } from "@mantine/core";
import { modals } from "@mantine/modals";
import { ModalClose } from "../icons/modal-close";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const zones = [
  "Last 24 hours",
  "UTC -7, 00:00 (Current)",
  "UTC +12, 00:00",
  "UTC +11, 00:00",
  "UTC +10, 00:00",
  "UTC +9, 00:00",
  "UTC +8, 00:00",
  "UTC +7, 00:00",
  "UTC +6, 00:00",
];

export const EditTimeZone = ({ initialTimezone }: { initialTimezone?: string }) => {
  const [selected, setSelected] = useState(initialTimezone || "Last 24 hours");
  const queryClient = useQueryClient();

  const { mutate: saveTimezone, isPending } = useMutation({
    mutationFn: (): Promise<any> =>
      userService.saveSettings({ timezone: selected }),
    onSuccess: () => {
      successNotification("Timezone updated");
      queryClient.invalidateQueries({ queryKey: userKeys.settings });
      modals.closeAll();
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold">24h Change & time zone basis</h4>
        <ModalClose onClick={() => modals.closeAll()} />
      </div>
      <div className="flex flex-col gap-16">
        <RadioGroup value={selected} onChange={setSelected}>
          <div className="flex flex-col gap-6">
            {zones.map((item) => (
              <Radio
                key={item}
                labelPosition="right"
                label={item}
                value={item}
              />
            ))}
          </div>
        </RadioGroup>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => modals.closeAll()}
            className="bg-gray-9 rounded-xl py-18px text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => saveTimezone()}
            disabled={isPending}
            className="bg-primary rounded-xl py-18px text-base font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader size="xs" color="white" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
