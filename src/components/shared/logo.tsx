"use client";

import LogoImage from "@/public/limiance-wordmark.png";
import { useUserStore } from "@/src/stores/user-store";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

export default function Logo({
  imageClasses,
  onClick,
}: {
  gap?: string;
  imageClasses?: string;
  textClasses?: string;
  onClick?: () => void;
}) {
  const user = useUserStore((state) => state.user);

  return (
    <Link
      href={user ? "/dashboard" : "/"}
      onClick={onClick}
      className="flex items-center"
    >
      <Image
        src={LogoImage}
        alt="Limiance"
        width={120}
        height={40}
        priority
        style={{ width: "auto", height: "auto" }}
        className={clsx(imageClasses ?? "w-[177px] max-sm:w-[130px] mt-2", "object-contain")}
      />
    </Link>
  );
}
