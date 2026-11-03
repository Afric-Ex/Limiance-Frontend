import React, { ReactNode } from "react";

interface FilterSectionProps {
  children: ReactNode;
}

export const FilterSection = ({ children }: FilterSectionProps) => {
  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.005] border border-white/[0.08] backdrop-blur-sm">
      {children}
    </div>
  );
};

export const FilterRow = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">{children}</div>;
};

export const FilterLeft = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-wrap gap-3 items-end">{children}</div>;
};

export const FilterRight = ({ children }: { children: ReactNode }) => {
  return <div className="flex items-center gap-3">{children}</div>;
};
