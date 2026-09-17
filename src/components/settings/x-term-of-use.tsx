"use client";

import { Checkbox } from "@mantine/core";
import { modals } from "@mantine/modals";
import { ModalClose } from "../icons/modal-close";

export const XTermOfUse = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold">Terms of use</h4>
        <ModalClose onClick={() => modals.closeAll()} />
      </div>
      <div className="py-5 border-b border-b-gray-9 text-gray-14 text-18px">
        <p>
          After clicking on the Link button below, you will be redirected to the
          X homepage to complete authorization for linking your account.
          Connecting your X account to your Limiance UID, and then link your X
          account to your Limiance account, enabling us to access your:
        </p>
        <ul className="pl-4 list-disc">
          <li>Twitter profile information</li>
          <li>Tweets from your timeline (including protected Tweets)</li>
          <li>
            Lists and collections. We will also be able to see your preferences
            (for example, accounts you follow, mute, and block).
          </li>
        </ul>
        <p>You can delink the accounts at any time.</p>
      </div>
      <div className="flex flex-col gap-3">
        <Checkbox
          classNames={{ input: "!bg-transparent !border-white" }}
          label="I understand, agree, and consent to the terms above."
          labelPosition="right"
        />
        <button className="py-3 rounded-lg text-base font-semibold bg-blue-3 text-primary">
          Link Account Now
        </button>
      </div>
    </div>
  );
};
