import React, { ReactNode } from "react";

export const SettingsModalContainer = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <div className="w-683px max-w-[95vw] px-10 py-12 bg-[#181a20] border border-white/[0.06] rounded-2xl max-[410px]:px-5 max-[410px]:py-8">
      {children}
    </div>
  );
};