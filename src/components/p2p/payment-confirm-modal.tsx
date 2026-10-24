"use client";

import React, { useState } from "react";
import { Modal, Button, Checkbox } from "@mantine/core";
import { MdWarning } from "react-icons/md";

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PaymentConfirmModal = ({ isOpen, onClose, onConfirm }: PaymentConfirmModalProps) => {
  const [checked, setChecked] = useState(false);

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Confirm Payment"
      centered
      classNames={{
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="bg-[#FBA42A]/10 border border-[#FBA42A]/20 p-3.5 rounded-lg text-xs text-[#FBA42A] flex items-start gap-2.5 leading-relaxed">
          <MdWarning size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Payment Verification Notice</span>
            <span>
              Clicking &quot;Confirm&quot; without actually making the payment will lead to your account being restricted or permanently banned.
            </span>
          </div>
        </div>

        <p className="text-white/70 text-xs leading-relaxed">
          Please confirm that you have successfully transferred the funds to the seller&apos;s provided payment method via your banking or payment app.
        </p>

        <Checkbox
          checked={checked}
          onChange={(event) => setChecked(event.currentTarget.checked)}
          label="I confirm that I have made the payment from an account matching my verified real name."
          classNames={{
            label: "!text-white/80 !text-xs leading-tight",
            body: "items-start",
          }}
          color="blue"
        />

        <div className="flex gap-2.5 mt-2">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-primary hover:!bg-primary/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            disabled={!checked}
            onClick={() => {
              setChecked(false);
              onConfirm();
            }}
          >
            Confirm Payment
          </Button>
        </div>
      </div>
    </Modal>
  );
};
