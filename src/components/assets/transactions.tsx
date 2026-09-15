"use client";

import { Table, TableTd, TableTh, TableTr, Tooltip } from "@mantine/core";
// import classes from "@/src/styles/assets-overview.module.css";
import { useState } from "react";
import { EmptyTable } from "../icons/empty-table";
import { assetKeys, asset } from "@/src/services/asset";
import { useQuery } from "@tanstack/react-query";
import { PendingIcon } from "../icons/pending-icon";
import { Copy } from "../shared/copy";
import { InlineLoading } from "../shared/inline-loading";
import { truncateCryptoAddress } from "@/src/utils/truncate-address";

export enum TransactionViews {
  RECENT = "recent",
  HISTORY = "history",
}

export const Transactions = () => {
  // const [view, setView] = useState(TransactionViews.RECENT);

  const [page] = useState(1);
  const limit = 30;

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: assetKeys.transactionHistory({
      page,
      limit,
    }),
    queryFn: () => asset.transactionHistory({ page, limit }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: Infinity,
  });

  return (
    <div className="py-5 h-292px border border-gray-9 rounded-32px bg-gray-7 px-7 pb-9 ">
      <div className="flex flex-col h-full gap-5">
        <div className="flex items-center gap-6">
          <h3 className="text-xl font-bold">Transactions</h3>
          {/* <SegmentedControl
            classNames={classes}
            data={[
              { label: "Recent", value: TransactionViews.RECENT },
              { value: TransactionViews.HISTORY, label: "History" },
            ]}
            value={view}
            onChange={(val) => setView(val as TransactionViews)}
          /> */}
        </div>
        {history ? (
          <Table
            classNames={{
              th: "!text-xs !text-gray-14 !font-normal",
              td: "!text-xs !font-medium",
            }}
          >
            <TableTr className="!bg-gray-22">
              <TableTh>Date & Time</TableTh>
              <TableTh>Coin</TableTh>
              <TableTh>Amount</TableTh>
              <TableTh>Transaction Type</TableTh>
              <TableTh>Address</TableTh>
              <TableTh>Network</TableTh>
              <TableTh>Transaction id</TableTh>
              <TableTh>Status</TableTh>
              {/* <TableTh>Action</TableTh> */}
            </TableTr>
            {history?.map((item: any) => (
              <TableTr key={item.id}>
                <TableTd>
                  <span className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-14">
                      {item.completedAt}
                    </span>
                    {/* <span className="text-primary text-10px font-bold">
                                  18:16:23
                                </span> */}
                  </span>
                </TableTd>
                <TableTd>
                  <span className="flex items-center gap-1">
                    {/* <Image src={images.usdt} alt="usdt" /> */}
                    <span className="text-xs font-medium uppercase">
                      {item.asset}
                    </span>
                  </span>
                </TableTd>
                <TableTd>{item.amount}</TableTd>
                <TableTd className="!capitalize">{item.type}</TableTd>
                <TableTd>
                  <span className="flex items-center gap-2">
                    <span>{truncateCryptoAddress(item.hash)}</span>
                    <Copy color="var(--primary)" text={item.hash} />
                  </span>
                </TableTd>
                <TableTd>
                  <span className="uppercase">{item.chain}</span>
                </TableTd>
                <TableTd>
                  <span className="flex items-center gap-2">
                    <span>{truncateCryptoAddress(item.id)}</span>
                    <Copy color="var(--primary)" text={item.id} />
                  </span>
                </TableTd>
                <TableTd>
                  <span className="flex items-center gap-1">
                    {item.status === "pending" ? (
                      <>
                        <span>Pending</span>
                        <Tooltip
                          multiline
                          withArrow
                          arrowSize={8}
                          w={220}
                          label="Assets will be debited from your account once the required number of confirmations is reached or exceeded."
                          color="elevated"
                        >
                          <span className="cursor-help">
                            <PendingIcon />
                          </span>
                        </Tooltip>
                      </>
                    ) : (
                      <span className="capitalize">{item.status}</span>
                    )}
                  </span>
                </TableTd>
                {/* <TableTd>
                              <span className="flex items-center cursor-pointer gap-2">
                                <span>Delete</span>
                                <FaTrash color="var(--primary)" />
                              </span>
                            </TableTd> */}
              </TableTr>
            ))}
          </Table>
        ) : (
          !historyLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <EmptyTable />
                <span className="text-xs font-medium text-gray-9">
                  No Records
                </span>
              </div>
            </div>
          )
        )}
        {historyLoading && (
          <div className="flex justify-center">
            <InlineLoading />
          </div>
        )}
      </div>
    </div>
  );
};
