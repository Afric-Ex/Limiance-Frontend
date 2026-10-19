"use client";

import React from "react";
import Link from "next/link";
import { Modal } from "@mantine/core";
import { MdCheck, MdKeyboardArrowRight, MdOutlineClose } from "react-icons/md";
import { FaAddressBook } from "react-icons/fa6";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { InlineLoading } from "../shared/inline-loading";
import { truncateWhitelistAddress } from "@/src/lib/whitelist";

export interface WhitelistPickerEntry {
  address: string;
  name?: string;
  pending: boolean;
  pendingLabel?: string;
}

interface WhitelistedAddressPickerModalProps {
  opened: boolean;
  onClose: () => void;
  entries: WhitelistPickerEntry[];
  loading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  selectedAddress?: string;
  onSelect: (address: string) => void;
}

export const WhitelistedAddressPickerModal = ({
  opened,
  onClose,
  entries,
  loading,
  isError,
  onRetry,
  selectedAddress,
  onSelect,
}: WhitelistedAddressPickerModalProps) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={false}
      size="auto"
      styles={DEFAULT_MODAL_SETTINGS.styles}
    >
      <div className="w-full max-w-[480px] max-[600px]:max-w-[calc(100vw-2rem)] bg-[#181a20] rounded-2xl border border-white/[0.06] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-white/[0.06]">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-lg font-bold text-white tracking-tight">Whitelisted Addresses</h4>
            <p className="text-xs text-white/40">Pick a saved address for this network</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/account/whitelisted-wallets"
              onClick={onClose}
              className="flex items-center gap-0.5 px-3 h-8 rounded-lg bg-primary/10 border border-primary/25 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
            >
              Manage whitelisted accounts
              <MdKeyboardArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
            >
              <MdOutlineClose size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <InlineLoading />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <span className="text-xs text-white/50">Whitelisted accounts could not be loaded.</span>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <FaAddressBook size={28} className="text-white/20" />
              <span className="text-sm font-semibold text-white/40">
                No whitelisted addresses for this network
              </span>
              <span className="text-xs text-white/30">
                Add one from Whitelisted Wallets, then it will show up here.
              </span>
            </div>
          ) : (
            entries.map((entry) => {
              const isSelected =
                !!selectedAddress &&
                entry.address.toLowerCase() === selectedAddress.toLowerCase();
              return (
                <button
                  key={entry.address}
                  type="button"
                  disabled={entry.pending}
                  onClick={() => onSelect(entry.address)}
                  className={`flex items-center justify-between gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all ${
                    entry.pending
                      ? "border-white/[0.04] bg-white/[0.01] opacity-60 cursor-not-allowed"
                      : isSelected
                        ? "border-primary/40 bg-primary/[0.06]"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]"
                  }`}
                >
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-semibold text-white/90 truncate">
                      {entry.name || "Whitelisted address"}
                    </span>
                    <span className="w-full break-all font-mono text-xs leading-5 text-white/60">
                      {truncateWhitelistAddress(entry.address)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {isSelected && !entry.pending ? (
                      <MdCheck size={16} className="text-primary" />
                    ) : null}
                    <span
                      className={
                        entry.pending
                          ? "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning-1/10 text-warning-1 border border-warning-1/20"
                          : "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-6/10 text-success-6 border border-success-6/20"
                      }
                    >
                      {entry.pending ? entry.pendingLabel || "Pending" : "Active"}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
