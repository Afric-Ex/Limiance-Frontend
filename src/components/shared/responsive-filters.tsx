"use client";

import { Popover, PopoverDropdown, PopoverTarget } from "@mantine/core";
import { ReactNode } from "react";
import { MdTune } from "react-icons/md";

export const ResponsiveFilters = ({ children }: { children: ReactNode }) => (
  <>
    <div className="hidden flex-wrap items-end gap-3 min-[768px]:flex">
      {children}
    </div>
    <div className="min-[768px]:hidden">
      <Popover position="bottom-start" shadow="md">
        <PopoverTarget>
          <button
            type="button"
            aria-label="Open filters"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.09] bg-elevated px-3 text-sm font-semibold text-white/75 transition-colors hover:border-white/[0.16] hover:text-white"
          >
            <MdTune aria-hidden="true" size={16} />
            Filters
          </button>
        </PopoverTarget>
        <PopoverDropdown className="!border-white/[0.08] !bg-[#181a20] !p-3">
          <div className="flex w-[min(320px,calc(100vw-48px))] flex-col items-stretch gap-3 [&>*]:!w-full">
            {children}
          </div>
        </PopoverDropdown>
      </Popover>
    </div>
  </>
);
