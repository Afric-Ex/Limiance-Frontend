import React, { ComponentProps } from "react";

export const Assets = (props?: ComponentProps<"svg">) => {
  return (
    <svg
      width="20"
      height="19"
      viewBox="0 0 20 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18 4.5V2.5C18 1.397 17.103 0.5 16 0.5H3C1.346 0.5 0 1.846 0 3.5V15.5C0 17.701 1.794 18.5 3 18.5H18C19.103 18.5 20 17.603 20 16.5V6.5C20 5.397 19.103 4.5 18 4.5ZM16 13.5H14V9.5H16V13.5ZM3 4.5C2.74252 4.48848 2.49941 4.37809 2.32128 4.19182C2.14315 4.00554 2.04373 3.75774 2.04373 3.5C2.04373 3.24226 2.14315 2.99446 2.32128 2.80818C2.49941 2.62191 2.74252 2.51152 3 2.5H16V4.5H3Z"
        fill={props?.color ?? "currentColor"}
        fillOpacity={props?.fillOpacity ?? "0.55"}
      />
    </svg>
  );
};
