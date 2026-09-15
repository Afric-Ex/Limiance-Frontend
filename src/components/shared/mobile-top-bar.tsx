"use client";

import React from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { IoChevronBack } from "react-icons/io5";

export interface MobileTopBarProps {
  /** Page title shown in the center */
  title?: string;
  /** Whether to show a back button on the left */
  showBack?: boolean;
  /** Custom left element — overrides showBack */
  leftElement?: React.ReactNode;
  /** Custom right element (e.g. notification bell, search icon) */
  rightElement?: React.ReactNode;
  /** Extra classes for the wrapper */
  className?: string;
}

/**
 * 48px sticky top bar for mobile pages.
 * Hidden on desktop (min-[1150px]:hidden).
 */
export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  title,
  showBack = false,
  leftElement,
  rightElement,
  className,
}) => {
  const router = useRouter();

  return (
    <div
      className={clsx(
        "min-[1150px]:hidden sticky top-0 z-30",
        "flex items-center justify-between px-4",
        "h-12 bg-surface/90 backdrop-blur-xl border-b border-white/[0.05]",
        className
      )}
    >
      {/* Left */}
      <div className="w-10 flex items-center">
        {leftElement ?? (
          showBack ? (
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] transition-all tap-scale"
              aria-label="Go back"
            >
              <IoChevronBack size={20} />
            </button>
          ) : null
        )}
      </div>

      {/* Title */}
      {title && (
        <h1 className="text-[15px] font-semibold text-white/90 flex-1 text-center">
          {title}
        </h1>
      )}

      {/* Right */}
      <div className="w-10 flex items-center justify-end">
        {rightElement}
      </div>
    </div>
  );
};
