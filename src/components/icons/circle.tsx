import React, { ComponentProps } from "react";

export const Circle = (props?: ComponentProps<"svg">) => {
  return (
    <svg
      width="33"
      height="33"
      viewBox="0 0 33 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="16.5" cy="16.5" r="16" stroke={props?.color ?? "#505050"} />
    </svg>
  );
};
