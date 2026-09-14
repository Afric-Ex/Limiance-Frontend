import React, { ReactNode } from "react";

export const HeroIconContainer = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <span onClick={onClick} className="w-56px h-56px flex items-center border border-gray-4 justify-center rounded-xl">
      {children}
    </span>
  );
};
