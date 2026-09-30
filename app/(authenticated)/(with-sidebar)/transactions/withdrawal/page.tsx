"use client";

import { Copy } from "@/src/components/shared/copy";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Button,
  LoadingOverlay,
  NumberInput,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Skeleton as MantineSkeleton,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { MdKeyboardArrowRight, MdOutlineHelp, MdOutlineSendToMobile } from "react-icons/md";
import { FiXCircle } from "react-icons/fi";
import { TokenNetworkModal } from "@/src/components/transactions/token-network-modal";
import { useWithdrawal } from "@/src/hooks/use-withdrawal";
import { useDisclosure } from "@mantine/hooks";
import { InlineLoading } from "@/src/components/shared/inline-loading";
import { WalletDropdown } from "@/src/components/assets/wallet-dropdown";
import { assetKeys, asset } from "@/src/services/asset";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { truncateCryptoAddress } from "@/src/utils/truncate-address";
import { TablePagination } from "@/src/components/shared/table-pagination";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { WithdrawalSkeleton } from "@/src/components/skeletons/orders";

const faqs = [
  {
    question: "How long does a withdrawal take?",
    answer: "Withdrawals are typically processed within 1–5 minutes, depending on network congestion and verification requirements.",
  },
  {
    question: "What are the fees for withdrawing assets?",
    answer: "Network fees vary by asset and chain. The exact fee is displayed before you confirm the withdrawal. Fees are deducted from the withdrawn amount.",
  },
  {
    question: "Why is my withdrawal request under review or delayed?",
    answer: "Large or unusual withdrawals may trigger additional security checks. This is to protect your account. Please allow up to 24 hours for review.",
  },
  {
    question: "Can I cancel a withdrawal?",
    answer: "Withdrawals that are already submitted to the blockchain cannot be cancelled. If your withdrawal is still in 'Pending' status due to review, please contact support.",
  },
  {
    question: "What if my withdrawal isn't credited?",
    answer: "Ensure you provided the correct address and network. If the transaction hash is confirmed on the blockchain but not credited by the recipient, please contact the relevant platform's support.",
  },
];

const StepBadge = ({ num }: { num: number }) => (
  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-[0_0_10px_rgba(77,119,240,0.4)]">
    {num}
  </div>
);

const InfoTooltip = ({ label }: { label: string }) => (
  <Tooltip withArrow multiline w={220} arrowSize={8} color="#181a20" label={label}
    classNames={{ tooltip: "!text-xs !font-medium !border !border-white/[0.08]" }}>
    <span className="cursor-help text-white/30 hover:text-white/60 transition-colors">
      <IoMdInformationCircleOutline size={14} />
    </span>
  </Tooltip>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    completed: "text-success-6 bg-success-6/10",
    pending: "text-warning-1 bg-warning-1/10",
    failed: "text-error-1 bg-error-1/10",
  };
  const key = status?.toLowerCase();
  return (
    <span className={`px-2 py-1 w-fit text-xs font-bold rounded-md uppercase tracking-wider ${styles[key] ?? "text-white/50 bg-white/[0.04]"}`}>
      {status}
    </span>
  );
};

const inputClass =
  "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20";

function validateAddress(address: string, networkSymbol: string): string | null {
  if (!address) return null;
  const sym = networkSymbol.toUpperCase();
  if (["ETH", "BSC", "MATIC", "AVAX", "ARB", "OP", "EVM"].some((s) => sym.includes(s))) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address))
      return "Invalid EVM address — must start with 0x and be 42 characters";
  } else if (sym === "BTC" || sym === "BITCOIN") {
    if (!/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address))
      return "Invalid Bitcoin address — must start with 1, 3, or bc1";
  } else if (sym === "SOL" || sym === "SOLANA") {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))
      return "Invalid Solana address — must be 32–44 base58 characters";
  } else if (sym === "TRX" || sym === "TRON") {
    if (!/^T[a-zA-Z0-9]{33}$/.test(address))
      return "Invalid Tron address — must start with T and be 34 characters";
  }
  return null;
}

function WithdrawalInner() {
  const {
    selectedCoin,
    form,
    selectedNetwork,
    setSelectedCoin,
    setSelectedNetwork,
    handleWithdrawal,
    emailVerificationLoading,
    withdrawalPending,
    withdrawableAmountAfterNetworkFee,
    networkFee,
    networkFeeKnown,
    networkFeeLoading,
    minimumWithdrawal,
    walletType,
    setWalletType,
    sourceWallet,
    setSourceWallet,
    withdrawalWalletLoading,
    resolvedWalletId,
  } = useWithdrawal();

  const { coins: portfolio, isLoading: portfolioLoading } = usePortfolioWs();

  // Per-asset balance for the selected coin, in coin units
  const coinPortfolio = selectedCoin?.symbol
    ? portfolio?.find((p: any) => p.symbol?.toUpperCase() === selectedCoin.symbol?.toUpperCase())
    : undefined;
  const assetBalance = sourceWallet === "spot"
    ? parseFloat(coinPortfolio?.spotBalance ?? "0")
    : parseFloat(coinPortfolio?.fundingBalance ?? "0");
  const assetBalanceLoading = portfolioLoading;

  const [page, setPage] = useState(1);
  const limit = 30;

  const { data: supportedTokens } = useQuery({
    queryKey: assetKeys.supportedTokensKey(""),
    queryFn: () => asset.fetchSupportedTokens(),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: assetKeys.transactionHistory({ page, limit, transaction_type: "withdrawal" }),
    queryFn: () => asset.transactionHistory({ page, limit, transaction_type: "withdrawal" }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
  });

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const addressError = form.values.address && selectedNetwork?.symbol
    ? validateAddress(form.values.address, selectedNetwork.symbol)
    : null;

  const amountError =
    +form.values.amount > assetBalance
      ? "Amount exceeds your available balance"
      : minimumWithdrawal > 0 && +form.values.amount < minimumWithdrawal
      ? `Minimum withdrawal is ${minimumWithdrawal} ${selectedCoin?.symbol}`
      : null;

  return (
    <div className="flex flex-col gap-10 relative max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-6">
      <LoadingOverlay visible={withdrawalPending} />

      <TokenNetworkModal
        opened={modalOpened}
        onClose={closeModal}
        onSelect={(coin, network) => {
          setSelectedCoin(coin);
          setSelectedNetwork(network);
        }}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-[1150px]:gap-4 items-start max-[1150px]:flex max-[1150px]:flex-col">

        {/* Left: Steps */}
        <div className="flex flex-col gap-4">

          {/* Step 1: Coin & Network */}
          <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl flex flex-col gap-5 max-[1150px]:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StepBadge num={1} />
                <h3 className="text-base font-bold text-white">Select Coin & Network</h3>
              </div>
              {selectedCoin.symbol && (
                <button
                  onClick={openModal}
                  className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            {selectedCoin.symbol && selectedNetwork.name ? (
              <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedCoin.image && (
                    <img src={selectedCoin.image} alt={selectedCoin.symbol} width={28} height={28} className="rounded-full shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white/90">{selectedCoin.symbol}</span>
                    <span className="text-xs text-white/40 truncate">{selectedCoin.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-white/30">via</span>
                  {selectedNetwork.image && (
                    <img src={selectedNetwork.image} alt={selectedNetwork.symbol} width={20} height={20} className="rounded-full shrink-0" />
                  )}
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">
                    {selectedNetwork.symbol || selectedNetwork.name}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={openModal}
                className="h-[56px] rounded-xl border border-white/[0.08] hover:border-primary/40 hover:bg-primary/[0.04] text-white/40 hover:text-primary text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                Select Coin & Network
                <MdKeyboardArrowRight size={18} />
              </button>
            )}
          </div>

          {/* Step 2: Withdrawal Details */}
          <div className={`bg-[#181a20] border rounded-2xl p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl flex flex-col gap-6 max-[1150px]:gap-4 transition-all ${selectedNetwork.name ? "border-white/[0.06]" : "border-white/[0.03] opacity-60 pointer-events-none"}`}>
            <div className="flex items-center gap-3">
              <StepBadge num={2} />
              <h3 className="text-base font-bold text-white">Withdrawal Details</h3>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Recipient Address</label>
              <TextInput
                classNames={{
                  input: inputClass,
                  section: "!w-fit !right-3",
                }}
                placeholder="Enter recipient wallet address"
                error={addressError}
                rightSection={
                  form.values.address ? (
                    <button onClick={() => form.setFieldValue("address", "")}>
                      <FiXCircle size={18} className="cursor-pointer text-white/30 hover:text-primary transition-colors" />
                    </button>
                  ) : null
                }
                {...form.getInputProps("address")}
              />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Amount</label>
                {selectedCoin?.symbol && (
                  <span className="text-xs font-medium text-white/40">
                    Available:{" "}
                    <span className="text-primary font-bold">
                      {assetBalanceLoading ? "..." : assetBalance.toFixed(8)}{" "}
                      <span className="text-white/40">{selectedCoin.symbol}</span>
                    </span>
                  </span>
                )}
              </div>
              <NumberInput
                thousandSeparator=","
                hideControls
                classNames={{
                  input: inputClass,
                  section: "!w-fit !right-3",
                }}
                placeholder="0.00"
                rightSection={
                  selectedCoin?.name ? (
                    <span className="flex items-center gap-2 pr-1">
                      <span className="flex items-center gap-1.5">
                        {selectedCoin?.image && (
                          <img src={selectedCoin?.image} width={16} height={16} alt={selectedCoin?.symbol} className="rounded-full" />
                        )}
                        <span className="text-xs font-bold text-white">{selectedCoin?.symbol}</span>
                      </span>
                      <button
                        onClick={() => form.setFieldValue("amount", String(assetBalance))}
                        className="px-2 py-1 bg-primary/15 hover:bg-primary/30 rounded-md text-xs text-primary font-bold transition-colors"
                      >
                        MAX
                      </button>
                    </span>
                  ) : null
                }
                error={amountError}
                {...form.getInputProps("amount")}
              />
            </div>

            {/* Details Rows */}
            {true && (
              <div className="flex flex-col gap-0 bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden">
                {false ? (
                  <div className="p-4 flex justify-center"><InlineLoading /></div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/50">Source Account</span>
                        <InfoTooltip label="Choose which account to debit for this withdrawal." />
                      </div>
                      <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
                        {(["funding", "spot"] as const).map((w) => (
                          <button
                            key={w}
                            onClick={() => setSourceWallet(w)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${
                              sourceWallet === w
                                ? "bg-primary text-white shadow-[0_0_8px_rgba(77,119,240,0.4)]"
                                : "text-white/40 hover:text-white/70"
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/50 capitalize">{sourceWallet} Balance</span>
                        <InfoTooltip label={`Withdrawals will be debited from your ${sourceWallet === "spot" ? "Spot" : "Funding"} Account.`} />
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {assetBalanceLoading ? <InlineLoading /> : assetBalance.toFixed(8)}
                        {" "}<span className="text-white/40 font-medium text-xs">{selectedCoin?.symbol || "—"}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/50">Withdrawal Channel</span>
                        <InfoTooltip label="Funds will be deducted directly from the selected wallet." />
                      </div>
                      <WalletDropdown selectedWallet={walletType} setSelectedWallet={setWalletType} />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                      <span className="text-sm text-white/50">Minimum Withdrawal</span>
                      <span className="text-sm font-bold text-primary">
                        {minimumWithdrawal || "—"}{" "}
                        <span className="text-white/40 font-medium text-xs">{selectedCoin?.symbol}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                      <span className="text-sm text-white/50">Network Fee</span>
                      <span className="text-sm font-bold text-white/70">
                        {networkFeeLoading
                          ? "Calculating..."
                          : networkFeeKnown
                            ? networkFee.toFixed(8)
                            : "—"}{" "}
                        <span className="text-white/40 font-medium text-xs">{selectedCoin?.symbol}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-white/50 font-semibold">Amount Received</span>
                      <span className={`text-sm font-bold ${withdrawableAmountAfterNetworkFee > 0 ? "text-success-6" : "text-error-1"}`}>
                        {(withdrawableAmountAfterNetworkFee < 0 ? 0 : withdrawableAmountAfterNetworkFee).toFixed(8)}{" "}
                        <span className="text-white/40 font-medium text-xs">{selectedCoin?.symbol}</span>
                      </span>
                    </div>

                    {selectedCoin?.contractAddress && (
                      <div className="border-t border-white/[0.04] flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/50">Contract Address</span>
                          <InfoTooltip label="Sending funds to a contract address may result in permanent loss of assets." />
                        </div>
                        <Popover classNames={{ dropdown: "!bg-[#181a20] !border-white/[0.08]" }}>
                          <PopoverTarget>
                            <button className="flex items-center gap-1 text-primary hover:text-primary/70 transition-colors">
                              <span className="text-xs font-medium">···{selectedCoin?.contractAddress?.slice(-6)}</span>
                              <MdKeyboardArrowRight size={14} />
                            </button>
                          </PopoverTarget>
                          <PopoverDropdown>
                            <div className="flex flex-col gap-2 w-72">
                              <span className="text-xs font-semibold text-white/40">Contract Address</span>
                              <div className="flex justify-between gap-3 bg-white/[0.04] p-3 rounded-xl items-center border border-white/[0.06]">
                                <span className="text-xs flex-1 text-white/70 font-mono break-all">{selectedCoin?.contractAddress}</span>
                                <Copy text={selectedCoin?.contractAddress} />
                              </div>
                            </div>
                          </PopoverDropdown>
                        </Popover>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Warning */}
            {selectedCoin?.name && selectedNetwork?.name && (
              <div className="bg-warning-1/[0.06] border border-warning-1/20 rounded-xl p-4 flex gap-3">
                <IoMdInformationCircleOutline size={18} className="text-warning-1 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-warning-1/80 leading-relaxed">
                  Please confirm you are withdrawing <strong>{selectedCoin?.symbol}</strong> to an address on the{" "}
                  <strong>{selectedNetwork?.name}</strong> network. Using an incorrect address or unsupported
                  network may result in the <strong>permanent loss of your assets.</strong>
                </span>
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleWithdrawal}
              className="!h-[56px] !rounded-xl !bg-primary hover:!bg-primary/90 hover:!shadow-[0_0_16px_rgba(77,119,240,0.3)] !text-white !font-bold !transition-all active:!scale-[0.98] disabled:!opacity-40"
              loading={emailVerificationLoading}
              disabled={
                withdrawalWalletLoading ||
                !resolvedWalletId ||
                withdrawableAmountAfterNetworkFee <= 0 ||
                !!addressError ||
                +form.values.amount > assetBalance ||
                (minimumWithdrawal > 0 && +form.values.amount < minimumWithdrawal)
              }
              leftSection={<MdOutlineSendToMobile size={18} />}
            >
              Confirm Withdrawal
            </Button>
          </div>
        </div>

        {/* Right: FAQ */}
        <div className="sticky top-6 bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl max-[1150px]:relative max-[1150px]:top-0 flex flex-col gap-5 max-[1150px]:gap-4 w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/50">
              <MdOutlineHelp size={18} />
            </div>
            <h3 className="text-lg font-bold text-white">Withdrawal FAQ</h3>
          </div>
          <Accordion
            classNames={{
              label: "!font-semibold !text-sm !text-white",
              chevron: "!text-primary !w-5 !h-5",
              panel: "!text-sm !text-white/50 !leading-relaxed",
              item: "data-[active]:!bg-primary/[0.04] !border !border-white/[0.06] data-[active]:!border-primary/20 !rounded-xl !mb-2",
              control: "hover:!bg-white/[0.02] !rounded-xl !transition-all",
              root: "!flex !flex-col !gap-2",
            }}
          >
            {faqs.map((item, idx) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionControl
                  icon={
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                  }
                >
                  {item.question}
                </AccordionControl>
                <AccordionPanel>{item.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-1">
          <h3 className="text-lg font-bold text-white">Withdrawal History</h3>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl max-[1150px]:rounded-xl overflow-hidden min-h-[200px]">
          <div className="overflow-x-auto">
            <Table classNames={{
              table: "min-w-[900px]",
              th: "!text-white/40 !uppercase !tracking-wider !text-xs !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]",
              td: "!text-sm !py-4 !border-b !border-white/[0.04] !text-white/80 !font-medium",
              tr: "hover:!bg-white/[0.02] !transition-colors",
            }}>
              <TableThead>
                <TableTr>
                  <TableTh className="pl-6">Date & Time</TableTh>
                  <TableTh>Coin</TableTh>
                  <TableTh>Amount</TableTh>
                  <TableTh>Address</TableTh>
                  <TableTh>Network</TableTh>
                  <TableTh>Transaction ID</TableTh>
                  <TableTh className="pr-6">Status</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {historyLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableTr key={`sk-${i}`}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableTd key={j} className={j === 0 ? "pl-6" : j === 6 ? "pr-6" : ""}>
                          <MantineSkeleton height={16} radius="sm" className="!bg-white/[0.04]" width={j === 5 ? "80%" : "60%"} />
                        </TableTd>
                      ))}
                    </TableTr>
                  ))}

                {history?.map((item: any) => (
                  <TableTr key={item.id}>
                    <TableTd className="pl-6 !text-white/40">{item.completedAt}</TableTd>
                    <TableTd>
                      <span className="flex items-center gap-2">
                        {(() => {
                          const token = supportedTokens?.find(
                            (t: any) => t?.symbol?.toUpperCase() === item?.asset?.toUpperCase()
                          );
                          return token?.image ? (
                            <img src={token.image} alt={item?.asset || ""} width={18} height={18} className="rounded-full" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">
                              {item?.asset?.[0] || "?"}
                            </span>
                          );
                        })()}
                        <span className="text-xs font-bold uppercase">{item?.asset || ""}</span>
                      </span>
                    </TableTd>
                    <TableTd className="!text-white !font-bold">{item.amount}</TableTd>
                    <TableTd>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs">{truncateCryptoAddress(item.hash)}</span>
                        <Copy color="var(--primary)" text={item.hash} />
                      </span>
                    </TableTd>
                    <TableTd className="uppercase font-bold">{item.chain}</TableTd>
                    <TableTd>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs">{truncateCryptoAddress(item.id)}</span>
                        <Copy color="var(--primary)" text={item.id} />
                      </span>
                    </TableTd>
                    <TableTd className="pr-6">
                      {item.status === "pending" ? (
                        <Tooltip multiline withArrow arrowSize={8} w={220}
                          label="Assets will be debited once the required confirmations are reached."
                          color="#181a20" classNames={{ tooltip: "!text-xs !border !border-white/[0.08]" }}>
                          <span className="cursor-help">
                            <StatusBadge status="pending" />
                          </span>
                        </Tooltip>
                      ) : (
                        <StatusBadge status={item.status} />
                      )}
                    </TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </div>

          {!history?.length && !historyLoading && (
            <div className="h-40 flex items-center justify-center flex-col gap-3 opacity-60">
              <MdOutlineSendToMobile size={32} className="text-white/20" />
              <span className="text-sm font-semibold text-white/30">No withdrawal transactions yet</span>
            </div>
          )}
        </div>

        <TablePagination totalCount={history?.length ?? 0} page={page} setPage={setPage} limit={limit} />
      </div>
    </div>
  );
}

export default function Withdrawal() {
  return (
    <PageSuspense fallback={<WithdrawalSkeleton />}>
      <WithdrawalInner />
    </PageSuspense>
  );
}
