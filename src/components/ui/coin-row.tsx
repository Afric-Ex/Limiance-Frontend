import React from "react";

export interface CoinRowProps {
  icon: React.ReactNode;
  ticker: React.ReactNode;
  name?: React.ReactNode;
  amount?: React.ReactNode;
  price?: React.ReactNode;
  action?: React.ReactNode;
}

export function CoinRow({ icon, ticker, name, amount, price, action }: CoinRowProps) {
  return (
    <div className="flex items-center gap-3 h-[var(--size-row-list)] px-4 border-b border-line/40 last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {ticker}
          </span>
          {name && (
            <span className="text-xs text-[var(--color-text-secondary)] truncate">
              {name}
            </span>
          )}
        </div>
      </div>
      {amount && (
        <div className="flex-1 text-sm text-[var(--color-text-primary)] text-right tabular-nums">
          {amount}
        </div>
      )}
      {price && (
        <div className="flex-1 text-sm text-[var(--color-text-secondary)] text-right tabular-nums hidden md:block">
          {price}
        </div>
      )}
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}