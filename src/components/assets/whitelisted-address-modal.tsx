"use client";

import { useState } from "react";
import { Button, Modal, TextInput } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MdAccountBalanceWallet } from "react-icons/md";
import { asset } from "@/src/services/asset";
import { errorMessageHandler, type ErrorType } from "@/src/lib/error-handler";
import {
  validateWhitelistAddress,
  type WhitelistedAddress,
} from "@/src/lib/whitelist";

interface Props {
  opened: boolean;
  onClose: () => void;
  chain: string;
  networkSymbol: string;
  onAdded?: (address: string) => void;
  existingAddresses?: WhitelistedAddress[];
}

const inputClass =
  "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20";

export function WhitelistedAddressModal({
  opened,
  onClose,
  chain,
  networkSymbol,
  onAdded,
  existingAddresses = [],
}: Props) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const queryClient = useQueryClient();
  const addAddress = useMutation({
    mutationFn: (payload: { address: string; name: string }) =>
      asset.addWhitelistedWithdrawalAddress({ chain, ...payload }),
    onSuccess: (_response, payload) => {
      setName("");
      setAddress("");
      onAdded?.(payload.address);
      onClose();
      void queryClient.invalidateQueries({
        queryKey: ["whitelisted-withdrawal-addresses"],
      });
    },
    onError: (error) => errorMessageHandler(error as ErrorType),
  });

  const validationError = address
    ? validateWhitelistAddress(address.trim(), networkSymbol)
    : null;
  const duplicateName = existingAddresses.some(
    (entry) => entry.name?.trim().toLowerCase() === name.trim().toLowerCase()
  );
  const nameError = name.trim() && duplicateName
    ? "This name is already used for a whitelisted wallet."
    : null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add whitelisted account"
      centered
      classNames={{
        content: "!bg-[#181a20] !border !border-white/[0.08]",
        header: "!bg-[#181a20] !text-white",
        title: "!text-white !font-bold",
        close: "!text-white/50 hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Name"
          placeholder="e.g. My Ledger"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          error={nameError}
          disabled={addAddress.isPending}
          classNames={{ input: inputClass, label: "!text-white/50 !mb-2" }}
          required
        />
        <TextInput
          label="Wallet address"
          placeholder="Enter wallet address"
          value={address}
          onChange={(event) => setAddress(event.currentTarget.value)}
          error={validationError}
          disabled={addAddress.isPending}
          classNames={{ input: inputClass, label: "!text-white/50 !mb-2" }}
        />
        <Button
          fullWidth
          loading={addAddress.isPending}
          disabled={!name.trim() || !address.trim() || !!validationError || !!nameError}
          className="disabled:!bg-primary/35 disabled:!text-white/65 disabled:!opacity-80 disabled:!shadow-none disabled:!cursor-not-allowed"
          onClick={() => addAddress.mutate({
            address: address.trim(),
            name: name.trim(),
          })}
        >
          Add whitelisted account
        </Button>
        <div className="flex items-center gap-3 text-xs font-semibold text-white/35">
          <span className="h-px flex-1 bg-white/[0.08]" />
          OR
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>
        <Button
          fullWidth
          variant="default"
          leftSection={<MdAccountBalanceWallet size={18} />}
          className="!h-12 !border-primary/40 !bg-gradient-to-r !from-primary/20 !to-violet-500/20 !text-white !font-bold !shadow-[0_0_18px_rgba(77,119,240,0.16)] hover:!border-primary/70 hover:!from-primary/30 hover:!to-violet-500/30 hover:!shadow-[0_0_24px_rgba(77,119,240,0.28)]"
        >
          Connect wallet
        </Button>
      </div>
    </Modal>
  );
}
