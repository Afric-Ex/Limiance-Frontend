import Image from "next/image";
import MarginBottom from "@/public/border-bottom.png";
import { ReactNode } from "react";

export const WithImageBorder = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col w-fit gap-1">
      {children}
      <Image
        src={MarginBottom}
        height={1}
        className="w-full"
        alt="margin bottom"
      />
    </div>
  );
};
