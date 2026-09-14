import React, { ComponentProps } from "react";

export const Info = (props?: ComponentProps<"svg">) => {
  return (
    <svg
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7 5.13346V7.80013M7 13.5C3.68629 13.5 1 10.8137 1 7.5C1 4.18629 3.68629 1.5 7 1.5C10.3137 1.5 13 4.18629 13 7.5C13 10.8137 10.3137 13.5 7 13.5ZM7.0332 9.80013V9.8668L6.9668 9.86654V9.80013H7.0332Z"
        stroke="currentColor"
        strokeWidth={props?.strokeWidth || 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
