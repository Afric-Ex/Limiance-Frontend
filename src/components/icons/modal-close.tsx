import React, { ComponentProps } from "react";

export const ModalClose = (props?: ComponentProps<"svg">) => {
  return (
    <svg
      width="29"
      height="29"
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="0.966797"
        y="0.977055"
        width="27.9659"
        height="27.9659"
        rx="13.983"
        fill="white"
        fillOpacity="0.08"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.6975 11.0871L18.8232 10.2128L14.9503 14.0919L11.0774 10.2128L10.2031 11.0871L14.0821 14.96L10.2031 18.8329L11.0774 19.7072L14.9503 15.8282L18.8232 19.7072L19.6975 18.8329L15.8185 14.96L19.6975 11.0871Z"
        fill="white"
      />
    </svg>
  );
};
