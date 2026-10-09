"use client";

import { Copy } from "@/src/components/shared/copy";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
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
  Tooltip,
} from "@mantine/core";
import { MdKeyboardArrowRight, MdOutlineHelp, MdOutlineQrCode } from "react-icons/md";
import { TokenNetworkModal } from "@/src/components/transactions/token-network-modal";
import { useDeposit } from "@/src/hooks/use-deposit";
import { useDisclosure } from "@mantine/hooks";
import { InlineLoading } from "@/src/components/shared/inline-loading";
import { WalletDropdown } from "@/src/components/assets/wallet-dropdown";
import { assetKeys, asset } from "@/src/services/asset";
import { readNumber, unwrapObject } from "@/src/lib/api-response";
import { useQuery } from "@tanstack/react-query";
import { truncateCryptoAddress } from "@/src/utils/truncate-address";
import { useInfiniteList } from "@/src/hooks/use-infinite-list";
import { InfiniteScrollTrigger } from "@/src/components/shared/infinite-scroll-trigger";

import { IoMdInformationCircleOutline } from "react-icons/io";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { DepositSkeleton } from "@/src/components/skeletons/orders";

const faqs = [
  {
    question: "What should I do to ensure a successful deposit?",
    answer: "Always double-check the deposit address and network type before sending funds. Ensure you are depositing the correct asset (e.g., USDT) to the specified address and using the supported network.",
  },
  {
    question: "What happens if I send funds to the wrong address?",
    answer: "Transactions on the blockchain are irreversible. If you send to the wrong address or network, Limiance cannot recover your funds. Always verify the address before confirming.",
  },
  {
    question: "Can I deposit using a smart contract?",
    answer: "Some assets do not support deposits via smart contracts. If a smart contract is used, the deposited funds will not be credited and will not be refunded. Check asset-specific notes for details.",
  },
  {
    question: "How long does it take for my deposit to be credited?",
    answer: "Most deposits are credited after receiving the required number of blockchain confirmations, typically within a few minutes. High network congestion may cause minor delays.",
  },
];

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

function DepositInner() {
  const {
    selectedCoin,
    selectedNetwork,
    setSelectedCoin,
    setSelectedNetwork,
    walletAddress,
    walletLoading,
    walletError,
    retryGenerateWallet,
    walletType,
    setWalletType,
    supportedTokens,
  } = useDeposit();

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const { data: minDepositData } = useQuery({
    queryKey: ["minimum-deposit", selectedCoin?.symbol, selectedNetwork?.name],
    queryFn: () => asset.minimumDeposit({ token: selectedCoin?.symbol, chain: selectedNetwork?.name }),
    enabled: !!selectedCoin?.symbol && !!selectedNetwork?.name,
    select: (res: unknown) => unwrapObject(res),
    retry: false,
    throwOnError: false,
  });

  const { data: networkFeeData } = useQuery({
    queryKey: ["deposit-network-fee", selectedNetwork?.symbol, selectedCoin?.symbol],
    queryFn: () => asset.networkFee({ chain: selectedNetwork?.symbol, token: selectedCoin?.symbol }),
    enabled: !!selectedNetwork?.symbol && !!selectedCoin?.symbol,
    select: (res: unknown) => unwrapObject(res),
    retry: false,
    throwOnError: false,
  });

  const minimumDeposit = readNumber(minDepositData, "minimum");
  const depositNetworkFee = readNumber(networkFeeData, "fee");

  const limit = 30;
  const transactionType = "deposit" as const;

  const {
    items: history,
    isPending: historyLoading,
    isFetchingNextPage,
    hasNextPage,
    loadedCount,
    isError: historyError,
    refetch: refetchHistory,
    fetchNextPage,
  } = useInfiniteList({
    queryKey: assetKeys.transactionHistoryList({ transactionType }),
    limit,
    filters: { transaction_type: transactionType },
    fetchPage: (params) => asset.transactionHistory(params),
  });

  return (
    <div className="flex flex-col gap-10 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-6">
      <TokenNetworkModal
        opened={modalOpened}
        onClose={closeModal}
        onSelect={(coin, network) => {
          setSelectedCoin(coin);
          setSelectedNetwork(network);
        }}
      />

      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-white tracking-tight">Deposit Crypto</h1>
        <span className="text-xs font-medium text-white/40">
          Send supported assets to your personal deposit address — they will be credited automatically.
        </span>
      </div>

      {/* Main Form + FAQ Grid */}
      <div className="grid grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-6 max-[1150px]:gap-4 items-start">

        {/* Main: Deposit card */}
        <div className="flex w-full min-w-0 flex-col gap-5 bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl">

          {/* Coin & Network picker */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {selectedCoin.symbol && selectedNetwork.name ? (
              <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-white/[0.04] rounded-xl min-w-0">
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
                className="h-[56px] px-5 rounded-xl border border-white/[0.08] hover:border-primary/40 hover:bg-primary/[0.04] text-white/40 hover:text-primary text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-0"
              >
                Select Coin & Network
                <MdKeyboardArrowRight size={18} />
              </button>
            )}
            <button
              onClick={openModal}
              className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors shrink-0"
            >
              Change
            </button>
          </div>

          <div className="h-px bg-white/[0.06]" />

          {/* Address + QR */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Deposit Address</label>
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 h-14 w-full min-w-0">
                {walletLoading ? (
                  <InlineLoading />
                ) : walletError ? (
                  <>
                    <span className="flex-1 text-sm text-error-1 font-medium">
                      Failed to generate address
                    </span>
                    <button
                      onClick={() => retryGenerateWallet()}
                      className="shrink-0 px-3 py-1 text-xs font-bold text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      Retry
                    </button>
                  </>
                ) : walletAddress ? (
                  <>
                    <span className="flex-1 min-w-0 text-sm font-bold text-white/90 tracking-wide break-all">
                      {walletAddress}
                    </span>
                    <Copy color="var(--primary)" text={walletAddress} />
                  </>
                ) : (
                  <span className="text-sm text-white/25 font-medium">
                    Select a coin and network to generate your address
                  </span>
                )}
              </div>
            </div>

            {/* QR Code */}
            {walletAddress && (
              <div className="flex justify-center shrink-0">
                <div className="p-3 bg-white rounded-xl shadow-[0_0_24px_rgba(77,119,240,0.15)]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(walletAddress)}`}
                    alt="Deposit QR Code"
                    width={120}
                    height={120}
                    className="block rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedCoin?.symbol && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Min Deposit</span>
                  <InfoTooltip label="Deposits below the minimum amount will neither be credited nor refunded." />
                </div>
                <span className="text-sm font-bold text-primary">
                  {minimumDeposit ?? "—"}{" "}
                  <span className="text-white/50 font-medium">{selectedCoin?.symbol}</span>
                </span>
              </div>
            )}

            {depositNetworkFee !== null && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Network Fee</span>
                  <InfoTooltip label="This fee is charged by the blockchain network, not Limiance." />
                </div>
                <span className="text-sm font-bold text-white/70">
                  {depositNetworkFee}{" "}
                  <span className="text-white/40 font-medium">{selectedCoin?.symbol}</span>
                </span>
              </div>
            )}

            <div className="sm:col-span-2 flex items-center justify-between gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Deposit Channel</span>
                <InfoTooltip label="All pending and future deposits will be directed to the selected wallet." />
              </div>
              <WalletDropdown selectedWallet={walletType} setSelectedWallet={setWalletType} />
            </div>

            {selectedCoin?.contractAddress && (
              <div className="sm:col-span-2 flex items-center justify-between gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Contract Address</span>
                  <InfoTooltip label="Contract addresses differ from deposit addresses. Sending funds to a contract address may result in permanent loss of assets." />
                </div>
                <Popover classNames={{ dropdown: "!bg-[#181a20] !border-white/[0.08] !px-1 !pt-3 !pb-2" }}>
                  <PopoverTarget>
                    <button className="flex items-center gap-1 text-primary hover:text-primary/70 transition-colors">
                      <span className="text-xs font-medium">···{selectedCoin?.contractAddress?.slice(-6)}</span>
                      <MdKeyboardArrowRight size={14} />
                    </button>
                  </PopoverTarget>
                  <PopoverDropdown>
                    <div className="flex flex-col gap-2 w-72">
                      <span className="text-xs font-semibold text-white/40 px-2">Contract Address</span>
                      <div className="flex justify-between gap-3 bg-white/[0.04] p-3 rounded-xl items-center border border-white/[0.06]">
                        <span className="text-xs flex-1 text-white/70 font-mono break-all">
                          {selectedCoin?.contractAddress}
                        </span>
                        <Copy text={selectedCoin?.contractAddress} color="var(--primary)" />
                      </div>
                    </div>
                  </PopoverDropdown>
                </Popover>
              </div>
            )}
          </div>

          <span className="text-xs text-white/30">
            Deposit credit routing is determined by the generated wallet and backend deposit rules.
          </span>

          {/* Warning Box */}
          {selectedCoin?.symbol && (
            <div className="bg-warning-1/[0.06] border border-warning-1/20 rounded-xl p-4 flex gap-3">
              <IoMdInformationCircleOutline size={18} className="text-warning-1 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-white/80">
                  Deposit {selectedCoin?.symbol} only via {selectedNetwork?.name ?? "selected network"}
                </span>
                <ul className="text-xs font-medium text-warning-1/80 list-disc pl-4 flex flex-col gap-1">
                  <li>Only send {selectedCoin?.symbol} ({selectedCoin?.name}) to this address.</li>
                  <li>Deposits from smart contracts will not be credited.</li>
                  <li>Incorrect network or asset selection may result in permanent loss.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right: FAQ */}
        <div className="sticky top-6 bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl max-[1150px]:relative max-[1150px]:top-0 flex flex-col gap-5 max-[1150px]:gap-4 w-full min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/50">
              <MdOutlineHelp size={18} />
            </div>
            <h3 className="text-lg font-bold text-white">Deposit FAQ</h3>
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

      {/* Deposit History */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-1">
          <h3 className="text-lg font-bold text-white">Deposit History</h3>
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
                            <img src={token.image} alt={item.asset} width={18} height={18} className="rounded-full" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">
                              {item.asset?.[0]}
                            </span>
                          );
                        })()}
                        <span className="text-xs font-bold uppercase">{item.asset}</span>
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
                          label="Assets will be credited once the required confirmations are reached."
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
              <MdOutlineQrCode size={32} className="text-white/20" />
              <span className="text-sm font-semibold text-white/30">No deposit transactions yet</span>
            </div>
          )}
        </div>

        <InfiniteScrollTrigger
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          loadedCount={loadedCount}
          isError={historyError}
          onRetry={refetchHistory}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </div>
  );
}

export default function Deposit() {
  return (
    <PageSuspense fallback={<DepositSkeleton />}>
      <DepositInner />
    </PageSuspense>
  );
}
