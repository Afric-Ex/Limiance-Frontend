"use client";

import React, { useState } from "react";
import { Modal, Button } from "@mantine/core";

interface FinalReleaseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cryptoAmount: number;
  asset: string;
  fiatAmount: number;
  fiat: string;
  buyerName: string;
  isProcessing?: boolean;
}

export const FinalReleaseConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  cryptoAmount,
  asset,
  fiatAmount,
  fiat,
  buyerName,
  isProcessing = false
}: FinalReleaseConfirmModalProps) => {
  return (
    <Modal
      opened={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      withCloseButton={!isProcessing}
      closeOnClickOutside={!isProcessing}
      closeOnEscape={!isProcessing}
      title={
        <div className="flex items-center gap-2 text-yellow-500">
          <span className="text-xl">⚠️</span> Final Confirmation
        </div>
      }
      centered
      classNames={{
        content: "bg-gray-900 text-white border border-yellow-500/20",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-lg font-bold",
        close: "text-white hover:bg-white/10"
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-white/80">You are about to release:</p>
        <div className="bg-black/20 p-4 rounded-lg border border-white/5 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {cryptoAmount.toLocaleString()} {asset}
          </div>
          <div className="text-white/50 text-sm">
            to <span className="text-white font-medium">{buyerName}</span>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-sm text-yellow-500/90 text-center">
          <p className="font-bold mb-2 uppercase tracking-wide">This action cannot be undone.</p>
          <p>
            Only proceed if you have confirmed receipt of <strong>{fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}</strong> in your actual bank/payment account.
          </p>
        </div>

        <div className="flex gap-3 mt-4">
          <Button 
            variant="light" 
            color="gray" 
            className="flex-1 bg-white/5 hover:bg-white/10 text-white border-none" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-[#F6465D] hover:bg-[#F6465D]/90 text-white"
            onClick={onConfirm}
            loading={isProcessing}
          >
            {isProcessing ? "Releasing..." : "Release Now"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
