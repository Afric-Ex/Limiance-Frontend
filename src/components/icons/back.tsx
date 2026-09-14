import React, { ComponentProps } from 'react';

export const Back = (props?: ComponentProps<'svg'>) => {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 11 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.499 6L0.500977 6"
        stroke="#4D77F0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.83366 10.999L0.500976 6L3.83366 1.00098"
        stroke="#4D77F0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
