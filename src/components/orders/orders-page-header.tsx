import React from "react";
import { ReactNode } from "react";

interface OrdersPageHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export const OrdersPageHeader = ({ icon, title, description }: OrdersPageHeaderProps) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          {title}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
};
