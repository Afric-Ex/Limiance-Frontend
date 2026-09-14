import React, { ReactNode } from "react";

export const SettingsModalContainer = ({
  children,
}: {
  children: ReactNode;
}) => {
  return <div className="bg-gray-7 w-683px px-10 py-12 rounded-2xl">{children}</div>;
};
