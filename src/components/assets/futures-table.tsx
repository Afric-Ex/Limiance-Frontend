"use client";

import { Table, TableTd, TableTh, TableTr } from "@mantine/core";
import { InlineLoading } from "../shared/inline-loading";
import { useState } from "react";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { ConvertAsset } from "../transactions/convert-asset";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

import { useRouter } from "next/navigation";

export const FuturesTable = () => {
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const router = useRouter();

  const { coins: portfolio, isLoading: portfolioLoading } = usePortfolioWs();

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white/80">Futures</h3>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setHideSmallBalances(!hideSmallBalances)}
            className={`w-9 h-5 rounded-full transition-colors relative ${hideSmallBalances ? "bg-primary" : "bg-white/10"}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hideSmallBalances ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </div>
          <span className="text-xs font-medium text-white/50">Hide Asset &lt;$1</span>
        </label>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] overflow-hidden">
        <div className="overflow-x-auto">
          {portfolioLoading ? (
            <div className="py-12 flex justify-center">
              <InlineLoading />
            </div>
          ) : (
            <Table
              classNames={{
                table: "min-w-[640px]",
                th: "!text-white/40 !uppercase !tracking-wider !text-[10px] !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]",
                td: "!text-sm !py-4 !border-b !border-white/[0.04] !font-medium",
                tr: "hover:!bg-white/[0.02] !transition-colors",
              }}
            >
              <thead>
                <TableTr>
                  <TableTh className="!pl-6">Coin</TableTh>
                  <TableTh>Amount</TableTh>
                  <TableTh>Price</TableTh>
                  <TableTh className="!pr-6 !text-right">Action</TableTh>
                </TableTr>
              </thead>
              <tbody>
                {!portfolio?.length ? (
                  <TableTr>
                    <TableTd colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/25">
                        <span className="text-sm font-medium">No futures assets</span>
                      </div>
                    </TableTd>
                  </TableTr>
                ) : (
                  portfolio.map((item: any, index: number) => {
                    const balStr = String(item.futuresBalance || "0").replace(/,/g, "");
                    const balNum = parseFloat(balStr);
                    const priceStr = String(item.currencyPrice || "0").replace(/,/g, "");
                    const priceNum = parseFloat(priceStr);
                    const valueUsd = balNum * priceNum;

                    if (hideSmallBalances && valueUsd < 1) return null;

                    return (
                      <TableTr key={`${item.symbol ?? item.name}-${index}`}>
                        <TableTd className="!pl-6">
                          <span className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 rounded-full shrink-0"
                              />
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                {item.symbol?.[0]}
                              </span>
                            )}
                            <span className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-white/90 uppercase">
                                {item.symbol}
                              </span>
                              <span className="text-[10px] text-white/40">{item.name}</span>
                            </span>
                          </span>
                        </TableTd>
                        <TableTd>
                          <span className="text-sm font-bold text-white">
                            {balNum.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                          </span>
                        </TableTd>
                        <TableTd>
                          <span className="text-sm text-white/60">
                            ${priceNum.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6,
                            })}
                          </span>
                        </TableTd>
                        <TableTd className="!pr-6 !text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/trades/futures`)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-[#181a20] transition-all active:scale-95"
                            >
                              Trade
                            </button>
                            <button
                              onClick={() =>
                                modals.open({
                                  children: <ConvertAsset defaultFromAsset={item.symbol} />,
                                  ...DEFAULT_MODAL_SETTINGS,
                                })
                              }
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
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
          )}
        </div>
      </div>
    </div>
  );
};
