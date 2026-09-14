"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Deposit page error:", error);
  }, [error]);

  return (
    <div className="p-4 bg-red-900/20 border border-red-500 rounded-xl m-4 flex flex-col gap-4 max-w-full overflow-hidden">
      <h2 className="text-red-500 font-bold text-lg">Application Error on Deposit Page</h2>
      <div className="text-xs text-white/80 whitespace-pre-wrap bg-[#181a20] p-4 rounded-lg overflow-auto max-h-[500px]">
        <p className="font-bold text-red-400 mb-2">{error.message}</p>
        <p>{error.stack}</p>
      </div>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded-lg w-fit text-sm font-bold hover:bg-red-600 transition-colors"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
