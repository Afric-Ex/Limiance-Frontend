import React, { useState } from "react";
import { modals } from "@mantine/modals";
import { MdOutlineClose, MdSwapHoriz } from "react-icons/md";
import {
  NumberInput,
  Popover,
  PopoverDropdown,
  PopoverTarget,
} from "@mantine/core";
import { AuthenticatorVerificationModal } from "./authenticator-verify-modal";
import { SuccessModal } from "../login/verify-email-success";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { SupportedListingsDropdown } from "../assets/supported-pairs-dropdown";
import { asset } from "@/src/services/asset";
import { useMutation } from "@tanstack/react-query";
import { SelectedCoin } from "@/src/hooks/use-deposit";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { InlineLoading } from "../shared/inline-loading";
import { errorNotification } from "@/src/lib/notification-handler";
import { IoChevronDown } from "react-icons/io5";
import { useUserStore } from "@/src/stores/user-store";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";


export const InternalTransfer = ({ defaultFrom = "spot", defaultTo = "funding" }: { defaultFrom?: string, defaultTo?: string }) => {
  const [selectedCoin, setSelectedCoin] = useState<SelectedCoin>({
    name: "",
    image: "",
    symbol: "",
    contractAddress: "",
  });

  const form = useForm({
    initialValues: {
      amount: "",
      sourceWallet: defaultFrom,
      destinationWallet: defaultTo,
    },
  });

  const user = useUserStore((state) => state.user);

  // Use WebSocket for real-time portfolio balances (REST endpoint unreliable)
  const { coins: portfolio, refreshBalances } = usePortfolioWs();

  const walletBalanceKey = form.values.sourceWallet === "spot" ? "spotBalance" : form.values.sourceWallet === "futures" ? "futuresBalance" : form.values.sourceWallet === "margin" ? "marginBalance" : "fundingBalance";
  const coinEntry = portfolio?.find((p: any) => p.symbol === selectedCoin.symbol || p.symbol?.toLowerCase() === selectedCoin.symbol?.toLowerCase());
  const availableBalance = coinEntry ? coinEntry[walletBalanceKey as keyof typeof coinEntry] as string : "0";
  // Send wallet type directly as "spot" or "funding" — what the backend expects
  const fromBalanceValue = form.values.sourceWallet;  // "spot" or "funding"
  const toBalanceValue = form.values.destinationWallet; // "spot" or "funding"

  const { mutate: internalTransfer, isPending } = useMutation({
    mutationFn: (totpCode?: string) =>
      asset.internalTransfer({
        symbol: selectedCoin?.symbol,
        fromBalance: fromBalanceValue,
        toBalance: toBalanceValue,
        amount: `${form.values.amount}`,
        totpCode,
      }),
    onSuccess: () => {
      // Refresh wallet balances over WebSocket
      refreshBalances();
      modals.open({
        children: (
          <SuccessModal
            title="Transfer Complete"
            description="Your internal transfer has been completed successfully"
            onProceed={modals.closeAll}
            onClose={modals.closeAll}
          />
        ),
        ...DEFAULT_MODAL_SETTINGS,
        onClose: modals.closeAll,
      });
    },
    onError(e) {
      errorMessageHandler(e);
    },
  });

  const accounts = [
    { label: "Funding", value: "funding" },
    { label: "Spot", value: "spot" },
    { label: "Futures", value: "futures" },
    { label: "Margin", value: "margin" },
  ];

  const getLabel = (value: string) => {
    return accounts.find((item) => item.value === value)?.label ?? "";
  };

  const [opened, { toggle, close }] = useDisclosure(false);
  const [destinationOpened, { toggle: toggleDest, close: closeDest }] =
    useDisclosure(false);

  const handleSwapWallets = () => {
    const src = form.values.sourceWallet;
    const dst = form.values.destinationWallet;
    form.setFieldValue("sourceWallet", dst);
    form.setFieldValue("destinationWallet", src);
  };

  const inputClass =
    "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20";

  const AccountSelector = ({
    label,
    value,
    isOpen,
    onToggle,
    onClose: onCloseDropdown,
    fieldName,
  }: {
    label: string;
    value: string;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    fieldName: string;
  }) => (
    <div className="flex flex-col flex-1 gap-2">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</label>
      <Popover
        opened={isOpen}
        onChange={onToggle}
        width="target"
        classNames={{
          dropdown: "!border !border-white/[0.08] !bg-elevated !rounded-xl !p-0 !overflow-hidden",
        }}
      >
        <PopoverTarget>
          <button
            onClick={onToggle}
            className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.18] cursor-pointer rounded-xl h-[56px] px-4 flex items-center justify-between transition-all"
          >
            <span className="font-semibold text-sm text-white/90">{getLabel(value)}</span>
            <IoChevronDown
              size={16}
              className={`text-white/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </PopoverTarget>
        <PopoverDropdown>
          <div className="flex flex-col">
            {accounts.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  form.setFieldValue(fieldName, item.value);
                  onCloseDropdown();
                }}
                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-white/[0.04] last:border-b-0 ${
                  item.value === value
                    ? "text-primary bg-primary/[0.06]"
                    : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </PopoverDropdown>
      </Popover>
    </div>
  );

  return (
    <div className="w-full max-w-[540px] max-[600px]:max-w-[calc(100vw-2rem)] bg-[#181a20] rounded-2xl max-[600px]:rounded-xl flex flex-col p-8 max-[600px]:p-5 gap-6 max-[600px]:gap-5 border border-white/[0.06] relative animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-white">Internal Transfer</h4>
          <p className="text-sm text-white/40 mt-1">Move funds between your accounts</p>
        </div>
        <button
          onClick={() => modals.closeAll()}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
        >
          <MdOutlineClose size={16} />
        </button>
      </div>

      {/* From / To Row */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-end gap-3">
          <AccountSelector
            label="From"
            value={form.values.sourceWallet}
            isOpen={opened}
            onToggle={toggle}
            onClose={close}
            fieldName="sourceWallet"
          />

          {/* Swap button */}
          <button
            onClick={handleSwapWallets}
            className="w-10 h-10 mb-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-primary hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-90 shrink-0"
          >
            <MdSwapHoriz size={20} />
          </button>

          <AccountSelector
            label="To"
            value={form.values.destinationWallet}
            isOpen={destinationOpened}
            onToggle={toggleDest}
            onClose={closeDest}
            fieldName="destinationWallet"
          />
        </div>
      </div>

      {/* Select Coin */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Select Coin</label>
        <SupportedListingsDropdown
          selectedCoin={selectedCoin}
          setSelectedCoin={setSelectedCoin}
        />
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Amount</label>
          {selectedCoin.symbol && (
            <span className="text-xs text-white/40">
              Available:{" "}
              <span className="font-bold text-primary">
                {(+availableBalance).toLocaleString("en-US", { maximumFractionDigits: 8 })}{" "}
                {selectedCoin.symbol}
              </span>
            </span>
          )}
        </div>
        <NumberInput
          hideControls
          classNames={{
            section: "!w-fit !right-3",
            input: inputClass,
          }}
          placeholder="0.00"
          rightSection={
            <span className="flex items-center gap-2">
              {selectedCoin?.name && (
                <span className="flex items-center gap-1.5">
                  {selectedCoin?.image && (
                    <img
                      src={selectedCoin?.image}
                      alt={selectedCoin?.name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-xs font-bold text-white">{selectedCoin?.symbol}</span>
                </span>
              )}
              <button
                onClick={() => form.setFieldValue("amount", availableBalance)}
                className="px-2 py-1 bg-primary/15 hover:bg-primary/30 rounded-md text-xs text-primary font-bold transition-colors"
              >
                MAX
              </button>
            </span>
          }
          thousandSeparator=","
          max={+availableBalance}
          clampBehavior="strict"
          {...form.getInputProps("amount")}
        />
      </div>

      {/* Submit */}
      <button
        onClick={() => {
          if (form.values.sourceWallet === form.values.destinationWallet) {
            return errorNotification(
              "You cannot transfer between the same wallet"
            );
          }
          if (user?.twoFaEnabled) {
            modals.open({
              children: (
                <AuthenticatorVerificationModal
                  email={user.email}
                  intitiateWithdrawal={(_, totp) => internalTransfer(totp)}
                />
              ),
              ...DEFAULT_MODAL_SETTINGS,
            });
          } else {
            internalTransfer(undefined);
          }
        }}
        disabled={isPending}
        className="h-[56px] rounded-xl bg-primary hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(77,119,240,0.3)] text-white font-bold transition-all active:scale-[0.98] disabled:bg-white/[0.04] disabled:text-white/30 disabled:shadow-none flex items-center justify-center gap-2"
      >
        {isPending ? <InlineLoading /> : "Confirm Transfer"}
      </button>
    </div>
  );
};
