import clsx from "clsx";
import { ReactNode } from "react";

export const WithCurvedImageBorder = ({
  children,
  display = true
}: {
  children: ReactNode;
  display?: boolean
}) => {
  return (
    <div className="flex flex-col items-center w-fit gap-1">
      {children}
      {/* <Image
        src={CurvedBorder}
        height={14}
        className="w-full shadow-7"
        alt="border bottom"
      /> */}
      <svg
        width="52"
        height="11"
        viewBox="0 0 52 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx(!display && "invisible")}
      >
        <path
          d="M2 9.5L4.62222 8.03761C19.0109 0.0131535 36.6516 0.575467 50.5 9.5V9.5"
          stroke="#4D77F0"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
