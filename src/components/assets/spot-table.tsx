"use client";

import { Checkbox, Table, TableTd, TableTh, TableTr } from "@mantine/core";
import { InlineLoading } from "../shared/inline-loading";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { ConvertAsset } from "../transactions/convert-asset";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { getCryptoIcon } from "@/src/utils/crypto-icons";

export const SpotTable = () => {
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const router = useRouter();

  const { coins: portfolio, isLoading: portfolioLoading } = usePortfolioWs({ coins: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-white/80">Spot</h3>
            <Checkbox
              classNames={{ input: "!bg-transparent !border-white" }}
              label="Hide Asset <$1"
              labelPosition="right"
              checked={hideSmallBalances}
              onChange={(e) => setHideSmallBalances(e.currentTarget.checked)}
            />
          </div>
          {portfolioLoading ? (
            <InlineLoading />
          ) : (
            <div className="w-full overflow-auto">
              <Table
                classNames={{
                  th: "text-white/40 text-xs font-medium uppercase tracking-wider py-3 border-b border-white/[0.06]",
                  tr: "border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors",
                  td: "py-4 text-sm text-white",
                }}
              >
                <TableTr>
                  <TableTh>Coin</TableTh>
                  <TableTh className="max-[1150px]:text-right">Amount</TableTh>
                  <TableTh className="max-[1150px]:hidden">Price</TableTh>
                  <TableTh className="max-[1150px]:hidden">Action</TableTh>
                </TableTr>
                {portfolio?.map((item: any, index: number) => {
                  const balStr = String(item.spotBalance || item.spot_balance || item.balance || item.free || "0").replace(/,/g, "");
                  const balNum = parseFloat(balStr);
                  const priceStr = String(item.currencyPrice || "0").replace(/,/g, "");
                  const priceNum = parseFloat(priceStr);
                  
                  const valueUsd = balNum * priceNum;
                  
                  if (hideSmallBalances && valueUsd < 1) return null;

                  return (
                    <TableTr key={`${item.symbol ?? item.name}-${index}`}>
                      <TableTd>
                        <span className="flex items-center gap-3">
                          {getCryptoIcon(item.symbol, item.image ?? item.logo ?? item.icon) ? (
                            <img
                              src={getCryptoIcon(item.symbol, item.image ?? item.logo ?? item.icon)}
                              alt={item.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/80 shrink-0">
                              {item.symbol?.charAt(0)}
                            </span>
                          )}
                          <span className="flex flex-col">
                            <span className="text-sm font-semibold text-white">
                              {item.symbol}
                            </span>
                            <span className="text-xs text-white/40">{item.name}</span>
                          </span>
                        </span>
                      </TableTd>
                      <TableTd className="max-[1150px]:text-right">
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-white">
                            {balNum.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                          </span>
                          <span className="text-xs text-white/40 min-[1150px]:hidden">
                            ${valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </span>
                      </TableTd>
                      <TableTd className="max-[1150px]:hidden">
                        <span className="text-sm font-medium text-white">
                          ${priceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </span>
                      </TableTd>
                      <TableTd className="max-[1150px]:hidden">
                        <div className="flex items-center gap-4">
                          <span
                            onClick={() => router.push(`/trades/spot`)}
                            className="text-sm font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors"
                          >
                            Trade
                          </span>
                          <span
                            onClick={() =>
                              modals.open({
                                children: <ConvertAsset defaultFromAsset={item.symbol} />,
                                ...DEFAULT_MODAL_SETTINGS,
                              })
                            }
                            className="text-sm font-semibold text-blue-500 hover:text-blue-400 cursor-pointer transition-colors"
                          >
                            Convert
                          </span>
                        </div>
                      </TableTd>
                    </TableTr>
                  );
                })}
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
