import React, { ComponentProps } from 'react';

export const Book = (props?: ComponentProps<'svg'>) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.66675 13C2.66675 12.558 2.84234 12.1341 3.1549 11.8215C3.46746 11.509 3.89139 11.3334 4.33341 11.3334H13.3334"
        stroke="#D9D9D9"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.33317 1.3335H13.3332V14.6668H4.33317C3.89114 14.6668 3.46722 14.4912 3.15466 14.1787C2.8421 13.8661 2.6665 13.4422 2.6665 13.0002V3.00016C2.6665 2.55814 2.8421 2.13421 3.15466 1.82165C3.46722 1.50909 3.89114 1.3335 4.33317 1.3335V1.3335Z"
        stroke="#D9D9D9"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
