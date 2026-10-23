"use client";

import React from "react";
import { Modal, Button } from "@mantine/core";
import { MdWarning } from "react-icons/md";

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
  isProcessing = false,
}: FinalReleaseConfirmModalProps) => {
  return (
    <Modal
      opened={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      withCloseButton={!isProcessing}
      closeOnClickOutside={!isProcessing}
      closeOnEscape={!isProcessing}
      title="Final Release Confirmation"
      centered
      classNames={{
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="bg-white/[0.03] p-4 rounded-lg border border-white/[0.06] text-center">
          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Releasing Crypto To Counterparty</div>
          <div className="text-xl font-bold text-white font-mono mb-1">
            {cryptoAmount.toLocaleString()} {asset}
          </div>
          <div className="text-white/50 text-xs">
            to <span className="text-white font-medium">{buyerName}</span>
          </div>
        </div>

        <div className="bg-[#FBA42A]/10 border border-[#FBA42A]/20 p-3.5 rounded-lg text-xs text-[#FBA42A] flex items-start gap-2.5 leading-relaxed">
          <MdWarning size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">This action is irreversible</span>
            <span>
              Only confirm if you have verified receipt of{" "}
              <strong className="text-white font-mono">
                {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}
              </strong>{" "}
              in your official bank or payment account.
            </span>
          </div>
        </div>

        <div className="flex gap-2.5 mt-2">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-[#F6465D] hover:!bg-[#F6465D]/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
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
