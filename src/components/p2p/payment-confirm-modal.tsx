"use client";

import React, { useState } from "react";
import { Modal, Button, Checkbox } from "@mantine/core";

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
        content: "bg-gray-900 text-white",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-lg font-bold text-white",
        close: "text-white hover:bg-white/10"
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-sm text-yellow-500/90">
          <p className="font-bold mb-2">⚠️ Warning</p>
          <p>
            Maliciously clicking &quot;I Have Paid&quot; without actually making the payment will lead to your account being restricted or permanently banned.
          </p>
        </div>

        <p className="text-white/80 text-sm">
          Please confirm that you have successfully transferred the funds to the seller&apos;s provided payment method via your banking or payment app.
        </p>

        <Checkbox
          checked={checked}
          onChange={(event) => setChecked(event.currentTarget.checked)}
          label="I confirm that I have made the payment from an account matching my verified name."
          classNames={{
            label: "text-white/80 text-sm leading-tight",
            body: "items-start"
          }}
          color="blue"
        />

        <div className="flex gap-3 mt-4">
          <Button variant="light" color="gray" className="flex-1 bg-white/5 hover:bg-white/10 text-white" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!checked}
            onClick={() => {
              setChecked(false);
              onConfirm();
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
