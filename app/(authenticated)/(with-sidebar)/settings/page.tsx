"use client";

import { LimianceAvatarSm } from "@/src/components/icons/limiance-avatar-sm";
import { PriceTrend } from "@/src/components/icons/price-trend";
import { ChartsColor } from "@/src/components/settings/charts-color";
import { EditProfile } from "@/src/components/settings/edit-profile";
import { FeeDeduction } from "@/src/components/settings/fee-deduction";
import { NotificationPreference } from "@/src/components/settings/notification-preference";
import { PriceAlert } from "@/src/components/settings/price-alert";
import {
  SettingsItem,
  SettingsItemContainer,
} from "@/src/components/settings/settings-item";
import { TradeReminder } from "@/src/components/settings/trade-reminder";
import { TransactionNotifications } from "@/src/components/settings/transaction-notifications";
import { XTermOfUse } from "@/src/components/settings/x-term-of-use";
import { useUserStore } from "@/src/stores/user-store";
import { useState, useEffect } from "react";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { WithSidebarSettingsSkeleton } from "@/src/components/skeletons";

function SettingsInner() {
  const user = useUserStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const settingsList = [
    {
      title: "Nickname & Avatar",
      description:
        "Set up an avatar and nickname, it is suggested not to use your real name or the name of your social account as a nickname.",
      descMaxWidth: "max-w-587px",
      rightSection: (
        <span className="flex items-center gap-3">
          <LimianceAvatarSm />
          <span className="text-base font-bold">{user?.username}</span>
        </span>
      ),
      buttonText: "Edit",
      withArrow: false,
      modal: <EditProfile />,
    },
    {
      group: [
        {
          title: "Notifications Preferences",
          description:
            "After configuration, you will get relevant on-site inbox notifications on the app and website.",
          descMaxWidth: "max-w-462px",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span className="flex text-sm font-medium flex-col text-right">
              Activities, Trade Notification, <br />
              Limiance News, System Messages
            </span>
          ),
          modal: <NotificationPreference />,
        },
        {
          title: "Price Alerts",
          description:
            "After setup, you will receive alerts about price changes for major and held cryptocurrencies.",
          descMaxWidth: "max-w-462px",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span className="flex text-sm font-medium flex-col text-right">
              Notification On, Sound On
            </span>
          ),
          modal: <PriceAlert />,
        },
        {
          title: "Transaction Notification",
          description:
            "Activated: Futures trading alerts, futures sound notifications, spot trading alerts, and spot sound notifications.",
          descMaxWidth: "max-w-462px",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span className="flex text-sm font-medium flex-col text-right">
              Futures trading, Spot trdading ( Sound )
            </span>
          ),
          modal: <TransactionNotifications />,
        },
      ],
    },
    {
      title: "Charts Color",
      description:
        "Customize your chart colors to enhance visibility of candlesticks, gridlines, and indicators on the exchange platform.",
      descMaxWidth: "max-w-528px",
      buttonText: "Edit",
      withArrow: true,
      rightSection: (
        <span className="flex items-center gap-3">
          <PriceTrend />
          <span className="text-sm font-medium">Green Up / Red down</span>
        </span>
      ),
      modal: <ChartsColor />,
    },
    {
      group: [
        {
          title: "Trade ( Order Confirmation Reminder)",
          description:
            "When the order reminder function is enabled, you will need to reconfirm each order submission.",
          descMaxWidth: "max-w-495px",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span className="flex text-sm font-medium flex-col text-right">
              Stop-Limit Order, Auto Borrow/
              <br />
              Repay for Margin
            </span>
          ),
          modal: <TradeReminder />,
        },
        {
          title: "Trade ( Fee Deduction )",
          description: "Use BNB to pay fees",
          descMaxWidth: "max-w-full",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span className="flex text-sm font-medium flex-col text-right">
              Spot Fees
            </span>
          ),
          modal: <FeeDeduction />,
        },
      ],
    },
    {
      title: "Link X Account",
      description: "Link your X account to Liminace",
      descMaxWidth: "max-w-full",
      buttonText: "Linked",
      withArrow: false,
      rightSection: (
        <span className="flex text-sm font-medium flex-col text-right">
          Disconnect
        </span>
      ),
      modal: <XTermOfUse />,
    },
  ];

  if (!mounted) return <WithSidebarSettingsSkeleton />;

  return (
    <main className="flex pb-10 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter flex-col gap-8 max-[1150px]:gap-4">
      <h3 className="text-2xl font-semibold">Preferences</h3>
      <div className="flex flex-col gap-7">
        {settingsList.map((item, index) => (
          <div key={item.title || index} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
            {item.group ? (
              <SettingsItemContainer isGroup>
                {item.group.map((el) => (
                  <SettingsItem {...el} key={el.title} withContainer={false} />
                ))}
              </SettingsItemContainer>
            ) : (
              <SettingsItem {...(item as any)} />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

export default function Settings() {
  return (
    <PageSuspense fallback={<WithSidebarSettingsSkeleton />}>
      <SettingsInner />
    </PageSuspense>
  );
}
