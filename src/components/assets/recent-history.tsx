"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { assetKeys, asset } from "@/src/services/asset";
import Link from "next/link";
import { Skeleton } from "../shared/skeleton";
import { formatTransactionAmount, formatTransactionAsset } from "@/src/utils/transaction";
import { fmtDate } from "../orders/orders-shared";
import { TransactionDetailsModal } from "../transactions/transaction-details-modal";

/**
 * RecentHistory — Right column component for Assets Overview.
 * Shows the most recent 5 deposit/withdrawal transactions.
 * Matches Bybit's "Recent Deposit & Withdrawal History" section.
 */
export const RecentHistory = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: assetKeys.transactionHistory({
      page: 1,
      limit: 5,
    }),
    queryFn: () => asset.transactionHistory({ page: 1, limit: 5 }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: Infinity,
  });

  return (
    <div className="animate-fade-up stagger-4 flex flex-col gap-4">
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-primary" />
          <h4 className="text-sm font-semibold">
            Recent Deposit & Withdrawal History
          </h4>
        </div>
        <Link
          href="/assets/history"
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          All →
        </Link>
      </div>

      {/* Transaction list or empty state */}
      <div className="rounded-xl border border-white/[0.06] bg-[#181a20] min-h-[200px] flex flex-col">
        {historyLoading ? (
          <div className="p-4">
            <Skeleton variant="table-row" count={3} columns={3} />
          </div>
        ) : history && history.length > 0 ? (
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedTransaction(item)}
                className="flex items-center justify-between px-4 py-3 row-hover cursor-pointer"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium capitalize">
                    {item.type}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {fmtDate(item.completedAt || item.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5 min-w-0">
                  <span className="text-xs font-semibold truncate max-w-full">
                    {formatTransactionAmount(item.amount)}{" "}
                    <span className="uppercase text-white/50">{formatTransactionAsset(item.asset, item.chain)}</span>
                  </span>
                  <span className="text-[10px] text-white/40 capitalize">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Illustrated empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white/10"
            >
              <rect
                x="8"
                y="6"
                width="32"
                height="36"
                rx="4"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16 18H32M16 24H28M16 30H24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x="28"
                y="32"
                width="14"
                height="14"
                rx="7"
                fill="#181a20"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M32 39H38M35 36V42"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs text-white/30">
              No recent history found.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
