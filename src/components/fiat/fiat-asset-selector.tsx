"use client";

import React, { useMemo, useState } from "react";
import { Loader, Popover, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IoChevronDownOutline } from "react-icons/io5";
import { Search } from "../icons/search";

interface FiatAssetSelectorProps {
  value: string;
  onChange: (value: string) => void;
  assets: string[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isError?: boolean;
  onRetry?: () => void;
  placeholder?: string;
  name?: string;
  id?: string;
}

/** Start the next page before the user hits the exact bottom, so the list keeps
 *  filling instead of stalling at the last row. */
const SCROLL_THRESHOLD_PX = 80;

const targetClass =
  "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus-within:!border-primary/60 focus-within:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 cursor-pointer";

/**
 * Asset picker for the fiat deposit rails. Mantine's `Select` renders its own
 * scroll container, which leaves no way to observe reaching the end of the list,
 * so this is a popover + scrollable list instead: scrolling near the bottom
 * pulls the next page and shows a loader while it is in flight.
 */
export const FiatAssetSelector = ({
  value,
  onChange,
  assets,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  isError,
  onRetry,
  placeholder = "Select an asset",
  name,
  id,
}: FiatAssetSelectorProps) => {
  const [opened, { close, toggle }] = useDisclosure(false);
  const [query, setQuery] = useState("");

  const filteredAssets = useMemo(() => {
    const search = query.trim().toUpperCase();
    return search ? assets.filter((a) => a.toUpperCase().includes(search)) : assets;
  }, [assets, query]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;
    const list = event.currentTarget;
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - SCROLL_THRESHOLD_PX) {
      onLoadMore();
    }
  };

  const select = (symbol: string) => {
    onChange(symbol);
    setQuery("");
    close();
  };

  return (
    <Popover opened={opened} onChange={close} width="target" position="bottom-start" shadow="xl">
      <Popover.Target>
        <div
          role="combobox"
          aria-expanded={opened}
          aria-controls={id}
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          }}
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          className={`${targetClass} w-full flex items-center justify-between px-4 gap-2`}
        >
          <span className={`truncate ${value ? "text-white" : "text-white/20"}`}>
            {value || (isLoading ? "Loading assets…" : placeholder)}
          </span>
          <IoChevronDownOutline size={18} className="text-white/40 shrink-0" />
        </div>
      </Popover.Target>

      <Popover.Dropdown className="!bg-[#181a20] !border !border-white/[0.08] !rounded-xl !p-0 !shadow-xl">
        {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

        <div className="p-2 border-b border-white/[0.06]">
          <TextInput
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            leftSection={<Search />}
            placeholder="Search asset"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            classNames={{
              input:
                "!h-[40px] !bg-white/[0.03] !border-white/[0.08] focus:!border-primary !rounded-lg !text-white !text-xs",
            }}
          />
        </div>

        <div
          onScroll={handleScroll}
          className="max-h-[240px] overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar"
        >
          {filteredAssets.map((asset) => (
            <button
              key={asset}
              type="button"
              role="option"
              aria-selected={asset === value}
              onClick={() => select(asset)}
              className={`text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                asset === value
                  ? "bg-primary/15 text-primary"
                  : "bg-white/[0.02] text-white/80 hover:bg-white/[0.06]"
              }`}
            >
              {asset}
            </button>
          ))}

          {!filteredAssets.length && !isLoading && !isLoadingMore ? (
            <span className="px-3 py-4 text-center text-xs text-white/30">No assets found</span>
          ) : null}

          {isError ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-[11px] text-white/40">Couldn&apos;t load assets</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[11px] font-bold text-white/70"
                >
                  Try again
                </button>
              )}
            </div>
          ) : null}

          {isLoadingMore ? (
            <div className="flex items-center justify-center py-3" aria-live="polite" aria-busy>
              <Loader size="xs" color="gray" />
            </div>
          ) : null}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};