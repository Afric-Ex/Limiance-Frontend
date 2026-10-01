"use client";

import { Table, TableTd, TableTh, TableTr, TextInput } from "@mantine/core";
import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { MdSwapHoriz } from "react-icons/md";
import { useAssets } from "@/src/hooks/use-assets";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { Skeleton } from "../shared/skeleton";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { ConvertAsset } from "../transactions/convert-asset";
import { getCryptoIcon } from "@/src/utils/crypto-icons";

/** Safely parse a value to a finite number, defaulting to 0. */
const safeNum = (v: unknown): number => {
  const n = parseFloat(String(v ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const FundingTable = () => {
  const [hideZero, setHideZero] = useState(false);
  const [search, setSearch] = useState("");
  const { handleOpenDepositModal, handleOpenInternalTransferModal } = useAssets();

  const { coins: portfolio, isLoading } = usePortfolioWs({ coins: true });

  const visibleAssets = portfolio?.filter((item: any) => {
    const passesZero = hideZero ? !!+item.fundingBalance : true;
    const passesSearch = search.trim()
      ? item.symbol.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase())
      : true;
    return passesZero && passesSearch;
  });

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Funding Assets</h3>
        <div className="flex flex-wrap items-center gap-3">
          <TextInput
            placeholder="Search coin…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftSection={<IoSearchOutline size={15} className="text-white/40" />}
            classNames={{
              input: "!bg-white/[0.04] !border !border-white/[0.08] !text-white !text-sm !rounded-xl !h-9 placeholder:!text-white/25 focus:!border-primary/50",
            }}
            styles={{ input: { width: 180 } }}
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setHideZero(!hideZero)}
              className={`w-9 h-5 rounded-full transition-colors relative ${hideZero ? "bg-primary" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hideZero ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-xs font-medium text-white/50">Hide zero balance</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] overflow-hidden">
        <div className="overflow-x-auto">
          <Table classNames={{
            table: "min-w-[640px]",
            th: "!text-white/40 !uppercase !tracking-wider !text-[10px] !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]",
            td: "!text-sm !py-4 !border-b !border-white/[0.04] !font-medium",
            tr: "hover:!bg-white/[0.02] !transition-colors",
          }}>
            <thead>
              <TableTr>
                <TableTh className="!pl-6">Coin</TableTh>
                <TableTh>Balance</TableTh>
                <TableTh>USD Value</TableTh>
                <TableTh>Price</TableTh>
                <TableTh className="!pr-6 !text-right">Actions</TableTh>
              </TableTr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableTr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableTd key={j} className={j === 0 ? "!pl-6" : j === 4 ? "!pr-6" : ""}>
                        <Skeleton variant="text" width={j === 0 ? "120px" : "80px"} height="16px" />
                      </TableTd>
                    ))}
                  </TableTr>
                ))
              ) : !visibleAssets?.length ? (
                <TableTr>
                  <TableTd colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/25">
                      <IoSearchOutline size={28} />
                      <span className="text-sm font-medium">No assets found</span>
                    </div>
                  </TableTd>
                </TableTr>
              ) : (
                visibleAssets.map((item, index) => {
                  const bal = safeNum(item.fundingBalance);
                  const price = safeNum(item.currencyPrice ?? item.usdPrice ?? item.price);
                  const usdVal = (bal * price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  const iconSrc = getCryptoIcon(item.symbol, item.image ?? item.logo ?? item.icon);
                  return (
                    <TableTr key={`${item.symbol}-${item.name ?? "asset"}-${index}`}>
                      <TableTd className="!pl-6">
                        <span className="flex items-center gap-3">
                          {iconSrc ? (
                            <img src={iconSrc} alt={item.symbol} width={32} height={32} className="rounded-full shrink-0 object-cover" />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/80 shrink-0">
                              {item.symbol?.[0] ?? "?"}
                            </span>
                          )}
                          <span className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-white/90 uppercase">{item.symbol}</span>
                            <span className="text-[10px] text-white/40">{item.name}</span>
                          </span>
                        </span>
                      </TableTd>
                      <TableTd>
                        <span className="text-sm font-bold text-white">{bal.toFixed(8)}</span>
                      </TableTd>
                      <TableTd>
                        <span className="text-sm font-semibold text-white/80">${usdVal}</span>
                      </TableTd>
                      <TableTd>
                        <span className="text-sm text-white/60">${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                      </TableTd>
                      <TableTd className="!pr-6 !text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleOpenDepositModal}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
                          >
                            Deposit
                          </button>
                          <button
                            onClick={() => handleOpenInternalTransferModal()}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center gap-1"
                          >
                            <MdSwapHoriz size={13} />
                            Transfer
                          </button>
                          <button
                            onClick={() => modals.open({ children: <ConvertAsset defaultFromAsset={item.symbol} />, ...DEFAULT_MODAL_SETTINGS })}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                          >
                            Convert
                          </button>
                        </div>
                      </TableTd>
                    </TableTr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};
