import { Accordion, Drawer } from "@mantine/core";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { BuyCryptoDropdown } from "./buy-crypto-dropdown";
import { EarnDropdown } from "./earn-dropdown";
import { MarketDropdown } from "./market-dropdown";
import { MoreDropdown } from "./more-dropdown";
import { IoIosGift } from "react-icons/io";
import Logo from "./logo";
import { useAssets } from "@/src/hooks/use-assets";
import { useUserStore } from "@/src/stores/user-store";
import { FiDownload } from "react-icons/fi";
import { ProfileDropdown } from "./profile-dropdown";
import { LanguageDropdown } from "./language-dropdown";
import { NotificationsDropdown } from "./notifications-dropdown";
import { WalletDropdown } from "./wallet-dropdown";
import { Logout } from "../icons/logout";
import { handleLogout } from "@/src/lib/handle-logout";
import { IoSettingsSharp } from "react-icons/io5";
import { Account } from "../icons/account";
import { BusinessCard } from "../icons/business-card";
import { Send } from "../icons/send";
import classes from "@/src/styles/dashboard.module.css";

export const MobileNavbar = ({
  opened,
  close,
}: {
  opened: boolean;
  close: () => void;
}) => {
  const list = [
    {
      name: "Buy crypto",
      children: <BuyCryptoDropdown />,
    },
    {
      name: "Markets",
      link: "",
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
    {
      name: "Profile",
      children: <ProfileDropdown isMobile />,
    },
    {
      name: "Notifications",
      children: <NotificationsDropdown />,
    },
    {
      name: "Wallet",
      children: <WalletDropdown />,
    },
    {
      name: "Language",
      children: <LanguageDropdown isMobile />,
    },
  ];

    const navLinks = [
      {
        name: "Rewards Hub",
        link: "/rewards-hub",
        icon: IoIosGift,
      },
      // {
      //   name: "Referral",
      //   link: "/referral",
      //   icon: BsPersonFillAdd,
      // },
      {
        name: "Account",
        routeIdentifier: "account",
        children: [
          {
            name: "Profile",
            link: "/account/profile",
          },
          {
            name: "Security",
            link: "/account/security",
          },
          {
            name: "API Keys",
            link: "/account/api-keys",
          },
        ],
        icon: Account,
      },
      // {
      //   name: "Sub Accounts",
      //   link: "/sub-accounts",
      //   icon: SubAccount,
      // },
      {
        name: "Settings",
        link: "/settings",
        icon: IoSettingsSharp,
      },
    ];

  const transacionLinks = [
    {
      name: "Deposit",
      link: "/transactions/deposit",
      icon: BusinessCard,
      children: undefined,
    },
    {
      name: "Withdrawal",
      link: "/transactions/withdrawal",
      icon: Send,
    },
    // {
    //   name: "Internal Transfer",
    //   link: "/transactions/internal-transfer",
    //   icon: Swap,
    // },
  ];

  const user = useUserStore((state) => state.user);
  const { handleOpenDepositModal } = useAssets();
  const pathname = usePathname();

  return (
    <Drawer
      styles={{
        body: {
          height: "100%",
          padding: 0,
        },
      }}
      classNames={{
        body: "!flex-1 !overflow-auto !rounded-none",
        header: "!bg-elevated/90 !backdrop-blur-xl border-b border-b-white/[0.04]",
        content: "!flex !flex-col !bg-elevated/90 !backdrop-blur-xl",
      }}
      opened={opened}
      onClose={close}
      position="left"
      size="xs"
      title={<Logo onClick={close} />}
    >
      <div className="h-full overflow-auto flex flex-col py-8 justify-between">
        {user ? (
          <>
            <div className="flex flex-1 overflow-auto flex-col text-primary-white gap-5">
              <button
                onClick={() => {
                  handleOpenDepositModal();
                  close();
                }}
                className="bg-primary flex justify-center mx-4 py-2 px-4 rounded-lg"
              >
                <span className="flex items-center gap-10px">
                  <FiDownload size={18} />
                  <span className="font-medium">Deposit</span>
                </span>
              </button>
              <div className="flex-1 overflow-auto flex flex-col gap-5">
                <div className="flex flex-col border-b pb-4 border-b-white/30 gap-2">
                  <h3 className="text-white text-sm font-bold px-4">MENU</h3>
                  <div className="flex flex-col gap-3">
                    {(pathname.includes("transactions")
                      ? transacionLinks
                      : navLinks
                    ).map((item, idx) =>
                      !item.children ? (
                        <Link
                          key={item.name}
                          href={item.link}
                          onClick={close}
                          style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                          className={clsx(
                            pathname.includes(item.link)
                              ? "bg-primary/[0.08] text-white border-l-[3px] border-primary"
                              : "bg-transparent hover:bg-white/[0.04] text-white/55 border-l-[3px] border-transparent hover:text-white",
                            "flex p-4 gap-3 items-center rounded-r-2xl transition-all animate-fade-in"
                          )}
                        >
                          <item.icon size={20} />
                          <span className="text-base font-medium">
                            {item.name}
                          </span>
                        </Link>
                      ) : (
                        <Accordion
                          key={item.name}
                          style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                          className="animate-fade-in"
                          // value={
                          //   pathname.includes(item.routeIdentifier ?? "")
                          //     ? item.routeIdentifier
                          //     : undefined
                          // }
                          styles={{
                            label: {
                              color: pathname.includes(
                                item.routeIdentifier ?? ""
                              )
                                ? "white"
                                : undefined,
                              fontWeight: pathname.includes(
                                item.routeIdentifier ?? ""
                              )
                                ? 600
                                : undefined,
                            },
                            chevron: {
                              color: pathname.includes(
                                item.routeIdentifier ?? ""
                              )
                                ? "white"
                                : undefined,
                            },
                            root: { width: "100%" },
                          }}
                          classNames={classes}
                        >
                          <Accordion.Item
                            key={item.name}
                            value={item.routeIdentifier ?? ""}
                          >
                            <Accordion.Control
                              icon={
                                <item.icon
                                  color={
                                    pathname.includes(
                                      item.routeIdentifier ?? ""
                                    )
                                      ? "white"
                                      : undefined
                                  }
                                  fillOpacity={
                                    pathname.includes(
                                      item.routeIdentifier ?? ""
                                    )
                                      ? "1"
                                      : undefined
                                  }
                                />
                              }
                            >
                              {item.name}
                            </Accordion.Control>
                            <Accordion.Panel>
                              {item.children?.map((el) => (
                                <Link
                                  key={el.name}
                                  href={el.link}
                                  onClick={close}
                                  className={clsx(
                                    pathname.includes(el.link)
                                      ? "bg-primary/[0.08] text-white border-l-[3px] border-primary"
                                      : "bg-transparent hover:bg-white/[0.04] text-white/55 border-l-[3px] border-transparent hover:text-white",
                                    "flex p-4 pl-11 gap-3 items-center rounded-r-2xl transition-all"
                                  )}
                                >
                                  <span className="text-base font-medium">
                                    {el.name}
                                  </span>
                                </Link>
                              ))}
                            </Accordion.Panel>
                          </Accordion.Item>
                        </Accordion>
                      )
                    )}
                  </div>
                </div>
                <div className="flex flex-col pb-4 gap-2">
                  <h3 className="text-white text-sm font-bold px-4">OTHERS</h3>
                  <div className="flex flex-col gap-3">
                    {list.map(({ name, children, link }) =>
                      children ? (
                        <Accordion
                          key={name}
                          styles={{ root: { width: "100%" } }}
                          classNames={classes}
                        >
                          <Accordion.Item value={name}>
                            <Accordion.Control>{name}</Accordion.Control>
                            <Accordion.Panel>{children}</Accordion.Panel>
                          </Accordion.Item>
                        </Accordion>
                      ) : (
                        <Link
                          key={name}
                          href={link ?? ""}
                          onClick={close}
                          className="bg-transparent hover:bg-primary-lighter text-white/55 flex p-4 gap-3 items-center rounded-r-2xl"
                        >
                          <span className="text-base font-medium">{name}</span>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div
              onClick={() => {
                handleLogout();
                close();
              }}
              className="py-5 px-6 flex cursor-pointer hover:bg-gray-9/20 items-center gap-3 border-t border-t-gray-9/40"
            >
              <Logout />
              <span className="text-xs text-white/65">Log Out</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col w-full px-4 gap-10">
            <Link onClick={close} href="/auth/login">
              <button className="font-medium py-3 w-full px-5 bg-gray-42 rounded-lg">
                Login
              </button>
            </Link>
            <Link onClick={close} href="/auth/signup">
              <button className="font-medium w-full py-3 px-4 bg-primary rounded-lg">
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </div>
    </Drawer>
  );
};
