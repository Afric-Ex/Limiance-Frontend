'use client';

import React, { useState } from 'react';

export const CopyButton = ({ text }: { text: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);

        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      }}
      className="text-base w-fit ml-auto font-medium py-2 px-4 rounded-full bg-transparent border border-primary"
    >
      {isCopied ? 'Copied' : 'Copy'}
    </button>
  );
};
