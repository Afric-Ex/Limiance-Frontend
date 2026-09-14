import React, { ComponentProps } from 'react';

export const TextFile = (props?: ComponentProps<'svg'>) => {
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
        d="M9.33341 1.33337H4.00008C3.64646 1.33337 3.30732 1.47385 3.05727 1.7239C2.80722 1.97395 2.66675 2.31309 2.66675 2.66671V13.3334C2.66675 13.687 2.80722 14.0261 3.05727 14.2762C3.30732 14.5262 3.64646 14.6667 4.00008 14.6667H12.0001C12.3537 14.6667 12.6928 14.5262 12.9429 14.2762C13.1929 14.0261 13.3334 13.687 13.3334 13.3334V5.33337L9.33341 1.33337Z"
        stroke={props?.stroke || `#D9D9D9`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6666 11.3334H5.33325"
        stroke={props?.stroke || `#D9D9D9`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6666 8.66663H5.33325"
        stroke={props?.stroke || `#D9D9D9`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.66659 6H5.99992H5.33325"
        stroke={props?.stroke || `#D9D9D9`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.33325 1.33337V5.33337H13.3333"
        stroke={props?.stroke || `#D9D9D9`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
