"use client";

import { usePathname as useNextPathname } from "next/navigation";
import { stripLocalePrefix } from "@/src/lib/locale-path";

/**
 * `usePathname()` without the locale prefix.
 *
 * The app serves every route under a locale prefix (e.g. /fr/dashboard), so the
 * raw pathname returned by Next cannot be compared against the internal route
 * constants ("/dashboard"). This wrapper returns the prefix-free path so route
 * matching (active states, page-specific chrome) keeps working.
 */
export function usePathname(): string {
  return stripLocalePrefix(useNextPathname() || "/");
}
