"use client";

import { useRouter } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";

export function BackButton({ href = "/dashboard" }: { href?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
      aria-label="Go back"
    >
      <IoChevronBack size={18} />
      <span>Back</span>
    </button>
  );
}