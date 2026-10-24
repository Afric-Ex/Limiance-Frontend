"use client";

import React, { useState } from "react";
import { Modal, Button, Select } from "@mantine/core";
import { MdCheckCircle, MdWarning } from "react-icons/md";

interface CancelOrderModalProps {
  opened: boolean;
  onClose: () => void;
  isBuyer: boolean;
  orderId: string;
  cryptoAmount: number;
  asset: string;
  isUpdating: boolean;
  handleCancel: (reason: string) => void;
}

export function CancelOrderModal({
  opened,
  onClose,
  isBuyer,
  orderId,
  cryptoAmount,
  asset,
  isUpdating,
  handleCancel,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState<string | null>(null);

  const buyerReasons = [
    { label: "I made a mistake", value: "I made a mistake" },
    { label: "I cannot complete payment right now", value: "I cannot complete payment right now" },
    { label: "Wrong payment method", value: "Wrong payment method" },
    { label: "Seller is not responding in chat", value: "Seller is not responding in chat" },
    { label: "Other", value: "Other" },
  ];

  const sellerReasons = [
    { label: "Buyer is not responding in chat", value: "Buyer is not responding in chat" },
    { label: "Order details are incorrect", value: "Order details are incorrect" },
    { label: "Payment method is unavailable", value: "Payment method is unavailable" },
    { label: "Suspicious activity", value: "Suspicious activity" },
    { label: "Other", value: "Other" },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Cancel Order"
      centered
      classNames={{
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-4 pt-2">
        <div className="bg-white/[0.03] p-3.5 rounded-lg border border-white/[0.06] text-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/40">Order Reference</span>
            <span className="text-white font-mono">{orderId.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/40">Crypto Amount</span>
            <span className="text-white font-bold font-mono">
              {cryptoAmount.toLocaleString()} {asset}
            </span>
          </div>
        </div>

        {isBuyer ? (
          <div className="bg-buy/[0.08] border border-buy/20 rounded-lg p-3 text-buy text-xs flex items-center gap-2">
            <MdCheckCircle size={15} className="shrink-0" />
            <span>No funds will be deducted from your account.</span>
          </div>
        ) : (
          <div className="bg-[#FBA42A]/10 border border-[#FBA42A]/20 rounded-lg p-3 text-[#FBA42A] text-xs flex items-start gap-2">
            <MdWarning size={15} className="shrink-0 mt-0.5" />
            <span>
              Your {cryptoAmount} {asset} will be returned to your Funding Account from escrow. Cancellations affect your
              completion rate.
            </span>
          </div>
        )}

        {isBuyer && (
          <div className="text-white/40 text-xs text-center">
            You have cancelled 0 of 3 allowed orders this month.
          </div>
        )}

        <div>
          <Select
            label="Select Cancellation Reason *"
            placeholder="Choose a reason"
            data={isBuyer ? buyerReasons : sellerReasons}
            value={reason}
            onChange={setReason}
            classNames={{
              label: "!text-white/60 !text-xs !mb-1.5 font-medium",
              input:
                "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !h-10 !rounded-lg !text-xs",
              dropdown: "!bg-[#181a20] !border !border-white/[0.09] !text-white !rounded-lg !shadow-2xl",
              option:
                "hover:!bg-white/[0.08] data-[combobox-selected]:!bg-primary/20 data-[combobox-selected]:!text-primary !rounded-md !mx-1 !my-0.5 !text-xs !transition-colors",
            }}
          />
        </div>

        <div className="flex gap-2.5 mt-2">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !text-xs !font-semibold !h-10 !rounded-lg"
            onClick={onClose}
          >
            Keep Order
          </Button>
          <Button
            className="flex-1 !bg-[#F6465D] hover:!bg-[#F6465D]/90 !text-white !text-xs !font-semibold !h-10 !rounded-lg"
            loading={isUpdating}
            onClick={() => reason && handleCancel(reason)}
            disabled={!reason}
          >
            Cancel Order
          </Button>
        </div>
      </div>
    </Modal>
  );
}
