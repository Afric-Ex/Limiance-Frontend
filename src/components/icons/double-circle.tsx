import React, { ComponentProps } from "react";

export const DoubleCircle = (props?: ComponentProps<"svg">) => {
  return (
    <svg
      width="39"
      height="37"
      viewBox="0 0 39 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="30.5" cy="28.5" r="8" stroke="#4D77F0" />
      <circle cx="16.5" cy="16.5" r="16" stroke="#505050" />
    </svg>
  );
};
