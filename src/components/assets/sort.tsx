import React from "react";

export const Sort = ({ state }: { state?: "asc" | "desc" }) => {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity={state === "asc" ? "0.5" : undefined}
        d="M7.63509 5.85413V6.54163L6.28092 7.99996L4.92676 6.54163V5.85413H7.63509Z"
        fill={
          state === "asc" ? "#848E9C" : state === "desc" ? "#4D77F0" : "#C1C6CD"
        }
      />
      <path
        opacity={state === "desc" ? "0.5" : undefined}
        d="M4.92676 4.56038V3.87288L6.28092 2.41455L7.63509 3.87288V4.56038H4.92676Z"
        fill={
          state === "desc" ? "#848E9C" : state === "asc" ? "#4D77F0" : "#C1C6CD"
        }
      />
    </svg>
  );
};
