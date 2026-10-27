"use client";

import LogoImage from "@/public/limiance-wordmark.png";
import { useUserStore } from "@/src/stores/user-store";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isAuthenticatedArea =
    pathname !== "/" && !pathname.startsWith("/auth");
  const destination = user || isAuthenticatedArea ? "/dashboard" : "/";

  return (
    <Link
      href={destination}
      onClick={onClick}
      className="flex items-center"
    >
      <Image
        src={LogoImage}
        alt="Limiance"
        width={120}
        height={32}
        priority
        style={{ width: "auto", height: 32 }}
        className={clsx(imageClasses ?? "max-sm:w-[130px]", "object-contain h-8")}
      />
    </Link>
  );
}
