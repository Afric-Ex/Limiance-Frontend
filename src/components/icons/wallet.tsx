import React, { ComponentProps } from "react";

export const Wallet = (props?: ComponentProps<"svg">) => {
  return (
    <svg
      width="21"
      height="18"
      viewBox="0 0 21 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18.5 4V2C18.5 0.897 17.603 0 16.5 0H3.5C1.846 0 0.5 1.346 0.5 3V15C0.5 17.201 2.294 18 3.5 18H18.5C19.603 18 20.5 17.103 20.5 16V6C20.5 4.897 19.603 4 18.5 4ZM16.5 13H14.5V9H16.5V13ZM3.5 4C3.24252 3.98848 2.99941 3.87809 2.82128 3.69182C2.64315 3.50554 2.54373 3.25774 2.54373 3C2.54373 2.74226 2.64315 2.49446 2.82128 2.30818C2.99941 2.12191 3.24252 2.01152 3.5 2H16.5V4H3.5Z"
        fill="white"
      />
    </svg>
  );
};
