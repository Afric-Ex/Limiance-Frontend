import React, { useState } from "react";
import { Modal, Button, Radio, Select, Textarea } from "@mantine/core";

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
        content: "bg-elevated border border-white/10",
        header: "bg-elevated border-b border-white/5",
        title: "text-white font-bold",
        close: "text-white/50 hover:text-white",
      }}
    >
      <div className="flex flex-col gap-4 pt-2">
        <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/50">Order Reference</span>
            <span className="text-white font-mono">{orderId.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50">Crypto Amount</span>
            <span className="text-white font-bold">{cryptoAmount.toLocaleString()} {asset}</span>
          </div>
        </div>

        {isBuyer ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-xs">
            ✓ No funds will be deducted from your account.
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-xs">
            ⚠️ Your {cryptoAmount} {asset} will be immediately returned to your Funding Account from escrow. Cancellations affect your completion rate.
          </div>
        )}

        {isBuyer && (
          <div className="text-white/50 text-xs text-center">
            You have cancelled 0 of 3 allowed orders this month.
          </div>
        )}

        <div>
          <Select
            label={<span className="text-white/70">Select Cancellation Reason *</span>}
            placeholder="Choose a reason"
            data={isBuyer ? buyerReasons : sellerReasons}
            value={reason}
            onChange={setReason}
            classNames={{
              input: "bg-white/5 border-white/10 text-white mt-1",
              dropdown: "bg-elevated border border-white/10 text-white",
              option: "hover:bg-white/5",
            }}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="filled" className="flex-1 bg-white/10 hover:bg-white/20 text-white" onClick={onClose}>
            Keep Order
          </Button>
          <Button 
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold" 
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
