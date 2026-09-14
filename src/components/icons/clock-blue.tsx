import React, { ComponentProps } from 'react';

export const BlueClock = (props?: ComponentProps<'svg'>) => {
  return (
    <svg
      width="12"
      height="13"
      viewBox="0 0 12 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 11.5C8.76142 11.5 11 9.26142 11 6.5C11 3.73858 8.76142 1.5 6 1.5C3.23858 1.5 1 3.73858 1 6.5C1 9.26142 3.23858 11.5 6 11.5Z"
        stroke="#727679"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 3.5V6.5L8 7.5"
        stroke="#4D77F0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
