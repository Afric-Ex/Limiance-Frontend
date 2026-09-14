import React, { ComponentProps } from "react";

export const Star = (props?: ComponentProps<"svg">) => {
  return (
    <svg
      width="40"
      height="36"
      viewBox="0 0 40 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.35069 33.7045L20.2822 26.6822L20.6974 26.4869L21.1163 26.6744L36.8482 33.7162L28.7309 18.5113L28.5148 18.1064L28.6808 17.6786L34.6493 2.29554L19.7178 9.31785L19.3026 9.51316L18.8837 9.32567L3.15185 2.28386L11.2691 17.4888L11.4852 17.8936L11.3192 18.3214L5.35069 33.7045Z"
        stroke="#6E6E6E"
        strokeWidth="2"
      />
    </svg>
  );
};
