import React, { ReactNode } from "react";

export const SettingsModalContainer = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <div className="w-full max-w-[600px] max-[640px]:max-w-[calc(100vw-2rem)] px-8 py-7 bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] max-[640px]:px-5 max-[640px]:py-6 animate-scale-in">
      {children}
    </div>
  );
};