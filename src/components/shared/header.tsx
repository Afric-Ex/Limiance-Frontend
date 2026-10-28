"use client";

import React, { useEffect, useState } from "react";
import Logo from "./logo";
import clsx from "clsx";
import { IoIosArrowDown } from "react-icons/io";
import { FiDownload } from "react-icons/fi";
import { CiMenuBurger, CiSearch } from "react-icons/ci";
import { PiBellFill } from "react-icons/pi";
import { FaGlobe } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { PopoverWrapper } from "./popover-wrapper";
import { MarketDropdown } from "./market-dropdown";
import { useUserStore } from "@/src/stores/user-store";
import { Skeleton } from "@mantine/core";
import Link from "next/link";
import { useAssets } from "@/src/hooks/use-assets";
import { BuyCryptoDropdown } from "./buy-crypto-dropdown";
import { EarnDropdown } from "./earn-dropdown";
import { MoreDropdown } from "./more-dropdown";
import { UserAvatar } from "./user-avatar";
import { LanguageDropdown } from "./language-dropdown";
import { NotificationsDropdown, NotificationDetailModal, useNotificationCount } from "./notifications-dropdown";
import { ProfileDropdown } from "./profile-dropdown";
import { MobileSideDrawer } from "./mobile-side-drawer";
import { useDisclosure } from "@mantine/hooks";

const navList = [
  {
    name: "Buy crypto",
    children: <BuyCryptoDropdown />,
    hover: true,
  },
  {
    name: "Markets",
    link: "/markets",
  },
  {
    name: "Trades",
    children: <MarketDropdown />,
    hover: true,
  },
  {
    name: "Earn",
    children: <EarnDropdown />,
    hover: true,
  },
  {
    name: "More",
    children: <MoreDropdown />,
    hover: true,
  },
];
const headerActionClasses = "cursor-pointer duration-300 hover:text-primary transition-all hover:scale-110 active:scale-95 text-white/90";

const headerIconActionsGroup1 = [
  {
    target: <UserAvatar className={headerActionClasses} size={28} />,
    children: <ProfileDropdown />,
  },
];

const NotificationBell = () => {
  const count = useNotificationCount();
  return (
    <span className="relative">
      <PiBellFill size={21} className={headerActionClasses} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </span>
  );
};

const noShadowHeaderPages = ["/dashboard", "/settings"];
const noShadowHeaderInnerPages = [
  "assets",
  "orders",
  "account",
  "trades",
  "transactions",
  "/auth/verify-identity",
];
const noMarginBottomInnerPages = ["trades"];

export default function Header() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const userLoading = useUserStore((state) => state.loading);
  const userHydrated = useUserStore((state) => state.hydrated);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const { handleOpenDepositModal } = useAssets();
  const [authHydrated, setAuthHydrated] = useState(false);
  const isPublicRoute = pathname === "/" || pathname.startsWith("/auth");

  useEffect(() => {
    setAuthHydrated(true);
  }, []);

  const [opened, { open, close }] = useDisclosure(false);

  // The landing page renders its own navigation.
  if (pathname === "/") return null;

  return (
<header
        className={clsx(
          noShadowHeaderPages.includes(pathname) ||
            noShadowHeaderInnerPages.some((each) => pathname.includes(each))
            ? ""
            : "shadow-1",
          noMarginBottomInnerPages.some((each) => pathname.includes(each)) ||
            !pathname.includes("auth")
            ? ""
            : "mb-2",
          "h-[var(--size-header-height)] md:px-8 px-4 py-1.5 flex items-center justify-between gap-2 sticky top-0 z-[100] backdrop-blur-xl bg-[#181a20]/90",
          authHydrated && user
            ? "border-b border-white/[0.06]"
            : ""
        )}
      >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <Logo />
          {/* <SegmentedControl classNames={classes} data={["Exchange", "DEX"]} /> */}
        </div>
        {authHydrated && user ? (
          <ul className="flex max-[1150px]:hidden items-center gap-4">
            {navList.map((item) => (
              <li key={item.name}>
                {item.children ? (
                  <PopoverWrapper
                    openOnHover={(item as any).hover}
                    target={({ toggle }) => (
                      <span
                        onClick={(item as any).hover ? undefined : toggle}
                        className="flex cursor-pointer items-center gap-6px"
                      >
                        <span>{item.name}</span>
                        <IoIosArrowDown size={14} color="white" />
                      </span>
                    )}
                  >
                    {item.children}
                  </PopoverWrapper>
                ) : (item as any).link ? (
                  <Link href={(item as any).link} className="cursor-pointer">
                    <span>{item.name}</span>
                  </Link>
                ) : (
                  <span>{item.name}</span>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
        <div className="flex max-[1150px]:hidden items-center gap-4">
          {!authHydrated ? null : !user ? (
            isPublicRoute ? (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <button className="font-medium h-8 px-4 bg-muted rounded-lg text-sm">
                    Log In
                  </button>
                </Link>
                <Link href="/auth/signup">
                  <button className="font-medium h-8 px-4 bg-primary rounded-lg text-sm">
                    Sign Up
                  </button>
                </Link>
              </div>
            ) : !userHydrated || userLoading ? (
              <div className="flex items-center gap-2" aria-label="Loading account">
                <Skeleton height={28} width={28} circle />
                <Skeleton height={10} width={70} />
              </div>
            ) : (
              <button
                onClick={() => void fetchUser()}
                className="text-xs font-medium text-white/60 hover:text-white transition-colors"
              >
                Retry account
              </button>
            )
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 h-8 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <CiSearch className="text-white/60" size={16} />
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-transparent text-sm text-white/80 placeholder:text-white/40 outline-none w-[200px]"
                />
              </div>
              <button
                onClick={handleOpenDepositModal}
                className={clsx(
                  "bg-primary h-8 px-4 rounded-lg text-sm"
                )}
              >
                <span className="flex items-center gap-2">
                  <FiDownload size={16} />
                  <span className="font-medium">Deposit</span>
                </span>
              </button>
              <div className="flex items-center gap-4">
                {headerIconActionsGroup1.map((item, idx) => (
                  <PopoverWrapper
                    key={idx}
                    target={({ toggle }) => (
                      <span onClick={toggle}>{item.target}</span>
                    )}
                  >
                    {item.children}
                  </PopoverWrapper>
                ))}
                <PopoverWrapper
                  target={({ toggle }) => (
                    <span onClick={toggle}>
                      <NotificationBell />
                    </span>
                  )}
                >
                  <NotificationsDropdown />
                </PopoverWrapper>
              </div>
            </div>
          )}
          <PopoverWrapper
            target={({ toggle }) => (
              <span onClick={toggle}>
                <FaGlobe size={18} className={headerActionClasses} />
              </span>
            )}
          >
            <LanguageDropdown />
          </PopoverWrapper>
        </div>
      
      <div className="hidden max-[1150px]:flex items-center gap-3">
        {authHydrated && user && (
          <>
            <button
              onClick={handleOpenDepositModal}
              className="flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-semibold text-white"
              aria-label="Deposit"
            >
              <FiDownload size={14} />
              Deposit
            </button>
            <PopoverWrapper
              target={({ toggle }) => (
                <span onClick={toggle}>
                  <UserAvatar className="cursor-pointer" size={28} />
                </span>
              )}
            >
              <ProfileDropdown />
            </PopoverWrapper>
            <PopoverWrapper
              target={({ toggle }) => (
                <span onClick={toggle}>
                  <NotificationBell />
                </span>
              )}
            >
              <NotificationsDropdown />
            </PopoverWrapper>
          </>
        )}
        <CiMenuBurger
          className="cursor-pointer"
          size="24"
          color="white"
          onClick={open}
        />
      </div>
      <MobileSideDrawer open={opened} onClose={close} />
      <NotificationDetailModal />
    </header>
  );
}