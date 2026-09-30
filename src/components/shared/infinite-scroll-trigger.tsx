"use client";

import { useEffect, useRef } from "react";
import { useIntersection } from "@mantine/hooks";
import { Button, Loader } from "@mantine/core";

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Pages currently held — a change here means the previous fetch landed. */
  loadedCount: number;
  onLoadMore: () => void;
  isError?: boolean;
  onRetry?: () => void;
}

/** Start fetching before the sentinel is actually on screen, so the next page
 *  is usually already there by the time the user reaches it. */
const ROOT_MARGIN = "320px";

/**
 * Sentinel that sits below a list and pulls the next page when it scrolls into
 * view. Renders the loading state itself, so callers don't need to know whether
 * a fetch is in flight.
 */
export const InfiniteScrollTrigger = ({
  hasNextPage,
  isFetchingNextPage,
  loadedCount,
  onLoadMore,
  isError,
  onRetry,
}: InfiniteScrollTriggerProps) => {
  const { ref, entry } = useIntersection<HTMLDivElement>({
    root: null,
    threshold: 0,
    rootMargin: ROOT_MARGIN,
  });

  // Tracks how many pages were on screen when we last asked for more, so the
  // same request can't be issued twice. Comparing against `loadedCount` rather
  // than a plain boolean is what lets the trigger chain: if a page doesn't fill
  // the viewport, the sentinel is still visible once the fetch lands, and we
  // should keep going rather than wait for the user to scroll again.
  const requestedAtCount = useRef(0);

  useEffect(() => {
    if (!entry?.isIntersecting || !hasNextPage || isFetchingNextPage) return;
    if (requestedAtCount.current >= loadedCount) return;
    requestedAtCount.current = loadedCount;
    onLoadMore();
  }, [entry, hasNextPage, isFetchingNextPage, loadedCount, onLoadMore]);

  if (isError) {
    return (
      <div ref={ref} className="flex flex-col items-center gap-3 py-6">
        <span className="text-xs font-medium text-white/40">
          Couldn&apos;t load more
        </span>
        {onRetry && (
          <Button
            variant="light"
            color="gray"
            size="xs"
            className="!bg-white/[0.06] hover:!bg-white/[0.1] !text-white/70"
            onClick={() => {
              requestedAtCount.current = 0;
              onRetry();
            }}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (!hasNextPage) {
    // Keeps the sentinel mounted after the final page so `hasNextPage` flipping
    // to false on the last fetch doesn't unmount before the observer settles.
    return <div ref={ref} aria-hidden className="h-px w-full" />;
  }

  return (
    <div
      ref={ref}
      aria-live="polite"
      aria-busy={isFetchingNextPage}
      className="flex items-center justify-center py-6"
    >
      {isFetchingNextPage ? (
        <Loader size="sm" color="gray" />
      ) : (
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          className="!text-white/30 hover:!text-white/60"
          onClick={onLoadMore}
        >
          Load more
        </Button>
      )}
    </div>
  );
};
