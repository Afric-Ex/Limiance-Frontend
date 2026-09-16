"use client";

import React from "react";
import Logo from "./logo";
import clsx from "clsx";
import { IoIosArrowDown } from "react-icons/io";
import { FiDownload } from "react-icons/fi";
import { CiMenuBurger, CiSearch } from "react-icons/ci";
import { PiBellFill } from "react-icons/pi";
import { Wallet } from "../icons/wallet";
import { FaGlobe } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { PopoverWrapper } from "./popover-wrapper";
import { MarketDropdown } from "./market-dropdown";
import { useUserStore } from "@/src/stores/user-store";
import Link from "next/link";
import { useAssets } from "@/src/hooks/use-assets";
import { BuyCryptoDropdown } from "./buy-crypto-dropdown";
import { EarnDropdown } from "./earn-dropdown";
import { MoreDropdown } from "./more-dropdown";
import { SettingsIcon } from "../icons/settings-icon";
import { UserAvatar } from "./user-avatar";
import { WalletDropdown } from "./wallet-dropdown";
import { LanguageDropdown } from "./language-dropdown";
import { NotificationsDropdown, useNotificationCount } from "./notifications-dropdown";
import { ProfileDropdown } from "./profile-dropdown";
import { MobileNavbar } from "./mobile-navbar";
import { useDisclosure } from "@mantine/hooks";

const navList = [
  {
    name: "Buy crypto",
    children: <BuyCryptoDropdown />,
  },
  {
    name: "Markets",
    link: "/markets",
  },
  {
    name: "Trades",
    children: <MarketDropdown />,
  },
  {
    name: "Earn",
    children: <EarnDropdown />,
  },
  {
    name: "More",
    children: <MoreDropdown />,
  },
];
const headerActionClasses = "cursor-pointer duration-300 hover:text-primary transition-all hover:scale-110 active:scale-95 text-white/90";

const headerIconActionsGroup1 = [
  {
    target: <UserAvatar className={headerActionClasses} />,
    children: <ProfileDropdown />,
  },
  {
    target: <Wallet className={headerActionClasses} />,
    children: <WalletDropdown />,
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
  const { handleOpenDepositModal } = useAssets();

  const [opened, { open, close }] = useDisclosure(false);

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
          : "mb-5",
        "h-[var(--size-header-height)] md:px-8 px-4 py-3 flex items-center justify-between gap-2 sticky top-0 z-[100] backdrop-blur-md bg-elevated/80"

      )}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <Logo />
          {/* <SegmentedControl classNames={classes} data={["Exchange", "DEX"]} /> */}
          {user && (
            <ul className="flex max-[1150px]:hidden items-center gap-4">
              {navList.map((item) => (
                <li key={item.name}>
                  {item.children ? (
                    <PopoverWrapper
                      target={({ toggle }) => (
                        <span
                          onClick={toggle}
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
          )}
        </div>
        {user ? (
          <ul className="flex max-[1150px]:hidden items-center gap-4">
            {navList.map((item) => (
              <li key={item.name}>
                {item.children ? (
                  <PopoverWrapper
                    target={({ toggle }) => (
                      <span
                        onClick={toggle}
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
      <div className="flex max-[1150px]:hidden items-center gap-6">
        {!user ? (
          <div className="flex items-center gap-6px">
            <Link href="/auth/login">
              <button className="font-medium py-3 px-5 bg-muted rounded-lg">
                Login
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="font-medium py-3 px-4 bg-primary rounded-lg">
                Sign Up
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-8">
            <CiSearch className={headerActionClasses} size={22} />
            <button
              onClick={handleOpenDepositModal}
              className={clsx(
                headerActionClasses,
                "bg-primary py-2 px-4 rounded-lg"
              )}
            >
              <span className="flex items-center gap-10px">
                <FiDownload size={18} />
                <span className="font-medium">Deposit</span>
              </span>
            </button>
            <div className="flex items-center gap-6">
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
              <FaGlobe size={21} className={headerActionClasses} />
            </span>
          )}
        >
          <LanguageDropdown />
        </PopoverWrapper>

        <Link href="/settings">
          <SettingsIcon className={headerActionClasses} />
        </Link>
      </div>
      
      <div className="hidden max-[1150px]:flex items-center gap-5">
        {user && (
          <PopoverWrapper
            target={({ toggle }) => (
              <span onClick={toggle}>
                <NotificationBell />
              </span>
            )}
          >
            <NotificationsDropdown />
          </PopoverWrapper>
        )}
        <CiMenuBurger
          className="cursor-pointer"
          size="28"
          color="white"
          onClick={open}
        />
      </div>
      <MobileNavbar opened={opened} close={close} />
    </header>
  );
}
