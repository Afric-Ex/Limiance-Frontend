import React, { ComponentProps } from 'react';

export const Twitch = (props?: ComponentProps<'svg'>) => {
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
        d="M10.6667 7.33337V4.66671M14 1.33337H2V12H5.33333V14.6667L8 12H11.3333L14 9.33337V1.33337ZM7.33333 7.33337V4.66671V7.33337Z"
        stroke={props?.stroke || `#D9D9D9`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
