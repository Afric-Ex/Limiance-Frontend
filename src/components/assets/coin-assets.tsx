import React from "react";
import { Table, TableTd, TableTh, TableTr } from "@mantine/core";
import classes from "@/src/styles/assets-overview.module.css";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { InlineLoading } from "../shared/inline-loading";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { ConvertAsset } from "../transactions/convert-asset";

export const CoinAssets = () => {
  const { coins: portfolio, isLoading: portfolioLoading } = usePortfolioWs();

  return (
    <Table
      classNames={{
        th: classes.table_th,
        tr: classes.table_tr,
      }}
    >
      <TableTr>
        <TableTh>Coin</TableTh>
        <TableTh>Amount</TableTh>
        <TableTh>Price</TableTh>
        <TableTh>Action</TableTh>
      </TableTr>
      {portfolioLoading ? (
        <InlineLoading />
      ) : (
        portfolio?.map((item: any) => (
          <TableTr key={item.name}>
            <TableTd>
              <span className="flex items-center gap-2">
                <img src={item.image} alt={item.name} width={26} height={26} />
                <span className="flex flex-col gap-2px">
                  <span className="text-base uppercase font-bold">
                    {item.symbol}
                  </span>
                  <span className="text-8px">{item.name}</span>
                </span>
              </span>
            </TableTd>
            <TableTd>
              <span className="flex flex-col gap-2px">
                <span className="text-base font-bold">
                  {+item.spotBalance +
                    +item.fundingBalance +
                    +item.futuresBalance +
                    +item.lockedBalance +
                    +item.marginBalance}
                </span>
                {/* <span className="text-8px">$0.00</span> */}
              </span>
            </TableTd>
            <TableTd>
              <span className="text-sm font-bold">${item.currencyPrice || 0}</span>
            </TableTd>
            <TableTd>
              <span
                onClick={() =>
                  modals.open({
                    children: <ConvertAsset defaultFromAsset={item.symbol} />,
                    ...DEFAULT_MODAL_SETTINGS,
                  })
                }
                className="text-sm font-bold text-primary cursor-pointer"
              >
                Convert
              </span>
            </TableTd>
          </TableTr>
        ))
      )}
    </Table>
  );
};
