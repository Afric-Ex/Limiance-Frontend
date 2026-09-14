import React, { ComponentProps } from "react";

export const ArrowTo = (props?: ComponentProps<"svg">) => {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M25.7867 20.5282L25.4408 10.3694L15.2821 10.7153"
        stroke="#4D77F0"
        strokeWidth="2.05357"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5344 15.6221L10.7215 26.1267"
        stroke="#4D77F0"
        strokeWidth="2.05357"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
