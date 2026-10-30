"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Button,
  Loader,
  Select,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { WhitelistedAddressModal } from "@/src/components/assets/whitelisted-address-modal";
import { asset, assetKeys } from "@/src/services/asset";
import { errorMessageHandler, type ErrorType } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import {
  parseWhitelistAddresses,
  truncateWhitelistAddress,
  type WhitelistedAddress,
} from "@/src/lib/whitelist";

function toChainList(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const entries = (value as { data?: unknown }).data;
    if (Array.isArray(entries)) return entries;
  }
  return [];
}

function getResponseError(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const result = response as { error?: unknown; success?: unknown; message?: unknown };
  if (result.error) return String(result.error);
  if (result.success === false) {
    return typeof result.message === "string"
      ? result.message
      : "The request could not be completed.";
  }
  return null;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function WhitelistedWalletsPage() {
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const chainsQuery = useQuery({
    queryKey: assetKeys.supportedChainsKey("whitelisted-wallets-page"),
    queryFn: async () => {
      const response: any = await asset.fetchSupportedChains({ limit: 100 });
      const error = getResponseError(response);
      if (error) throw new Error(error);
      return toChainList(response);
    },
    select: (response) => toChainList(response),
  });

  const chainsData = chainsQuery.data;

  const networks = useMemo(() => {
    const unique = new Map<string, NonNullable<typeof chainsData>[number]>();
    for (const network of chainsData ?? []) {
      const chain = network.blockchain || network.symbol;
      if (chain && !unique.has(chain)) unique.set(chain, network);
    }
    return Array.from(unique.entries()).map(([chain, network]) => ({
      chain,
      symbol: network.symbol,
      label: `${network.name || network.symbol} (${chain})`,
    }));
  }, [chainsData]);

  useEffect(() => {
    if (!selectedChain && networks.length) setSelectedChain(networks[0].chain);
  }, [networks, selectedChain]);

  const whitelistQuery = useQuery({
    queryKey: assetKeys.whitelistedWithdrawalAddresses(selectedChain ?? ""),
    queryFn: async () => {
      const response = await asset.whitelistedWithdrawalAddresses(selectedChain!);
      const error = getResponseError(response);
      if (error) throw new Error(error);
      return parseWhitelistAddresses(response);
    },
    enabled: !!selectedChain,
  });

  const removeAddress = useMutation({
    mutationFn: async ({ chain, entry }: { chain: string; entry: WhitelistedAddress }) => {
      const response = await asset.removeWhitelistedWithdrawalAddress({
        chain,
        address: entry.address,
      });
      const error = getResponseError(response);
      if (error) throw new Error(error);
      return response;
    },
    onSuccess: async (_response, { chain }) => {
      successNotification("Whitelisted wallet removed");
      await queryClient.invalidateQueries({
        queryKey: assetKeys.whitelistedWithdrawalAddresses(chain),
      });
    },
    onError: (error) => errorMessageHandler(error as ErrorType),
  });

  const activeNetwork = networks.find(({ chain }) => chain === selectedChain);
  const addresses = whitelistQuery.data ?? [];

  return (
    <main className="flex flex-col gap-6 max-[1150px]:pb-[90px] page-enter">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Whitelisted Wallets</h1>
          <p className="mt-1 text-sm text-white/45">
            Manage wallet addresses approved for withdrawals.
          </p>
        </div>
        <Button onClick={openModal} disabled={!selectedChain}>
          Add whitelisted account
        </Button>
      </header>

      <section className="rounded-2xl border border-white/[0.06] bg-[#181a20] p-5 max-[640px]:p-4">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <Select
            label="Network"
            placeholder={chainsQuery.isLoading ? "Loading networks..." : "Select network"}
            data={networks.map(({ chain, label }) => ({ value: chain, label }))}
            value={selectedChain}
            onChange={setSelectedChain}
            searchable
            disabled={chainsQuery.isLoading || chainsQuery.isError || !networks.length}
            className="w-full max-w-sm"
            classNames={{
              label: "!mb-2 !text-xs !font-semibold !text-white/50",
              input: "!border-white/[0.08] !bg-white/[0.03] !text-white",
              dropdown: "!border-white/[0.08] !bg-[#181a20]",
              option: "!text-white hover:!bg-white/[0.06]",
            }}
          />
          <ActionIcon
            variant="subtle"
            aria-label="Refresh whitelisted wallets"
            onClick={() => void whitelistQuery.refetch()}
            disabled={!selectedChain || whitelistQuery.isFetching}
            className="!text-white/55 hover:!text-white"
          >
            <FiRefreshCw className={whitelistQuery.isFetching ? "animate-spin" : ""} />
          </ActionIcon>
        </div>

        {chainsQuery.isError ? (
          <div className="py-10 text-center text-sm text-red-400">
            Unable to load supported networks.
            <Button
              variant="subtle"
              size="xs"
              onClick={() => void chainsQuery.refetch()}
              className="ml-2"
            >
              Retry
            </Button>
          </div>
        ) : chainsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader size="sm" />
          </div>
        ) : networks.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/45">
            No supported networks are available.
          </div>
        ) : whitelistQuery.isError ? (
          <div className="py-10 text-center text-sm text-red-400">
            Unable to load whitelisted wallets.
            <Button
              variant="subtle"
              size="xs"
              onClick={() => void whitelistQuery.refetch()}
              className="ml-2"
            >
              Retry
            </Button>
          </div>
        ) : whitelistQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader size="sm" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table classNames={{
              table: "min-w-[680px]",
              th: "!border-b !border-white/[0.06] !bg-[#181a20] !py-3 !text-[10px] !font-bold !uppercase !tracking-wider !text-white/40",
              td: "!border-b !border-white/[0.04] !py-4 !text-sm !text-white/75",
            }}>
              <TableThead>
                <TableTr>
                  <TableTh>Name</TableTh>
                  <TableTh>Address</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Created At</TableTh>
                  <TableTh>Updated At</TableTh>
                  <TableTh className="!text-right">Action</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {addresses.length ? addresses.map((entry, index) => (
                  <TableTr key={`${entry.address}-${index}`}>
                    <TableTd>{entry.name || "—"}</TableTd>
                    <TableTd>
                      <span title={entry.address} className="font-mono">
                        {truncateWhitelistAddress(entry.address)}
                      </span>
                    </TableTd>
                    <TableTd>
                      {entry.isActive ? (
                        <span className="font-semibold text-green-400">Active</span>
                      ) : entry.activatesAt ? (
                        <span className="text-amber-300">
                          Pending until {formatDate(entry.activatesAt)}
                        </span>
                      ) : (
                        <span className="text-white/40">Inactive</span>
                      )}
                    </TableTd>
                    <TableTd>{formatDate(entry.createdAt)}</TableTd>
                    <TableTd>{formatDate(entry.updatedAt)}</TableTd>
                    <TableTd className="!text-right">
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        leftSection={<FiTrash2 size={14} />}
                        loading={
                          removeAddress.isPending &&
                          removeAddress.variables?.entry.address === entry.address
                        }
                        disabled={removeAddress.isPending}
                        onClick={() => {
                          if (window.confirm(`Remove ${entry.address} from whitelisted wallets?`)) {
                            if (selectedChain) removeAddress.mutate({ chain: selectedChain, entry });
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </TableTd>
                  </TableTr>
                )) : (
                  <TableTr>
                    <TableTd colSpan={6}>
                      <div className="py-10 text-center text-sm text-white/40">
                        No whitelisted wallets for {activeNetwork?.label ?? "this network"}.
                      </div>
                    </TableTd>
                  </TableTr>
                )}
              </TableTbody>
            </Table>
          </div>
        )}
      </section>

      <WhitelistedAddressModal
        opened={modalOpened}
        onClose={closeModal}
        chain={selectedChain ?? ""}
        networkSymbol={activeNetwork?.symbol ?? ""}
        existingAddresses={addresses}
      />
    </main>
  );
}
