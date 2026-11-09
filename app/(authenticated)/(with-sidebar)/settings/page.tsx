"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MdOutlineCheckCircle,
  MdOutlineNotificationsActive,
  MdOutlineSettings,
  MdOutlineTune,
} from "react-icons/md";
import { LimianceAvatarSm } from "@/src/components/icons/limiance-avatar-sm";
import { PriceTrend } from "@/src/components/icons/price-trend";
import { PriceTrend2 } from "@/src/components/icons/price-trend-2";
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
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { WithSidebarSettingsSkeleton } from "@/src/components/skeletons/with-sidebar";
import { userKeys, userService } from "@/src/services/user";
import { useUserStore } from "@/src/stores/user-store";

function SettingsInner() {
  const user = useUserStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  const settingsQuery = useQuery({
    queryKey: userKeys.settings,
    queryFn: userService.getSettings,
    select: (response) => response.data,
  });
  const settings = settingsQuery.data;

  useEffect(() => {
    setMounted(true);
  }, []);

  const preferenceSummary = (items: [string, boolean][]) => {
    if (settingsQuery.isLoading) return "Loading preferences…";
    if (settingsQuery.isError) return "Unavailable";
    const enabled = items.filter(([, value]) => value).map(([label]) => label);
    return enabled.length ? enabled.join(" · ") : "All turned off";
  };

  const settingsList = [
    {
      title: "Nickname & avatar",
      description:
        "Choose a nickname and avatar to personalize your account. Avoid using your real name.",
      descMaxWidth: "max-w-[560px]",
      rightSection: (
        <span className="flex items-center gap-3">
          <LimianceAvatarSm />
          <span className="max-w-[160px] truncate text-sm font-semibold text-white">
            {user?.username || "Set a nickname"}
          </span>
        </span>
      ),
      buttonText: "Edit",
      withArrow: false,
      modal: <EditProfile />,
    },
    {
      group: [
        {
          title: "Notification preferences",
          description:
            "Choose which account activity and platform updates appear in your inbox.",
          descMaxWidth: "max-w-[460px]",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span>
              {preferenceSummary([
                ["Activities", settings?.notificationPreference.activities ?? false],
                ["Trade alerts", settings?.notificationPreference.tradeNotification ?? false],
                ["News", settings?.notificationPreference.news ?? false],
                ["System", settings?.notificationPreference.systemMessages ?? false],
              ])}
            </span>
          ),
          modal: <NotificationPreference />,
        },
        {
          title: "Price alerts",
          description:
            "Manage alerts for price changes across major and held cryptocurrencies.",
          descMaxWidth: "max-w-[460px]",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span>
              {preferenceSummary([
                ["Price alerts", settings?.priceAlerts.priceOn ?? false],
                ["Notifications", settings?.priceAlerts.notificationOn ?? false],
              ])}
            </span>
          ),
          modal: <PriceAlert />,
        },
        {
          title: "Transaction notifications",
          description:
            "Choose which spot and futures activity notifications you want to receive.",
          descMaxWidth: "max-w-[460px]",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span>
              {preferenceSummary([
                ["Futures", settings?.transactionNotifications.futuresTradingNotification ?? false],
                ["Futures sound", settings?.transactionNotifications.futuresNotificationSound ?? false],
                ["Spot", settings?.transactionNotifications.spotTradingNotification ?? false],
                ["Spot sound", settings?.transactionNotifications.spotNotificationSound ?? false],
              ])}
            </span>
          ),
          modal: <TransactionNotifications />,
        },
      ],
    },
    {
      title: "Chart colors",
      description:
        "Set the direction colors used for candlesticks and market movement.",
      descMaxWidth: "max-w-[520px]",
      buttonText: "Edit",
      withArrow: true,
      rightSection: (
        <span className="flex items-center gap-3">
          {settings?.chartColor ? <PriceTrend2 /> : <PriceTrend />}
          <span className="text-sm font-medium">
            {settingsQuery.isLoading
              ? "Loading preferences…"
              : settingsQuery.isError
                ? "Unavailable"
                : settings?.chartColor
                  ? "Red up · Green down"
                  : "Green up · Red down"}
          </span>
        </span>
      ),
      modal: <ChartsColor />,
    },
    {
      group: [
        {
          title: "Order confirmations",
          description:
            "Choose which orders require confirmation before they are submitted.",
          descMaxWidth: "max-w-[460px]",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span>
              {preferenceSummary([
                ["Limit", settings?.tradeOrdersNotificationReminder.limitOrder ?? false],
                ["Market", settings?.tradeOrdersNotificationReminder.marketOrder ?? false],
                ["Stop", settings?.tradeOrdersNotificationReminder.stopOrder ?? false],
                ["Margin", settings?.tradeOrdersNotificationReminder.autoBorrowRepayMargin ?? false],
              ])}
            </span>
          ),
          modal: <TradeReminder />,
        },
        {
          title: "Fee deductions",
          description: "Choose whether to use LIM to pay eligible trading fees.",
          descMaxWidth: "max-w-[460px]",
          buttonText: "Edit",
          withArrow: false,
          rightSection: (
            <span>
              {preferenceSummary([
                ["Spot", settings?.tradeFeeDeductions.useBNBToPayFees ?? false],
                ["Margin", settings?.tradeFeeDeductions.useBNBToPayMarginFees ?? false],
                ["Futures", settings?.tradeFeeDeductions.useBNBToPayFuturesFees ?? false],
              ])}
            </span>
          ),
          modal: <FeeDeduction />,
        },
      ],
    },
  ];

  if (!mounted) return <WithSidebarSettingsSkeleton />;

  return (
    <main className="page-enter mx-auto flex w-full max-w-[1240px] flex-col gap-7 px-2 pb-12 max-[1150px]:px-1 max-[1150px]:pb-[100px] max-[640px]:gap-5">
      <section
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.22)] max-[640px]:rounded-2xl max-[640px]:p-5"
        style={{
          background:
            "radial-gradient(ellipse at 90% 0%, color-mix(in srgb, var(--color-primary) 20%, transparent), transparent 42%), linear-gradient(130deg, var(--color-elevated) 0%, var(--color-surface) 72%)",
        }}
      >
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 max-[640px]:items-start">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.09] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <MdOutlineTune size={15} />
              Account controls
            </div>
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.035em] text-white max-[640px]:text-2xl">
              Preferences
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Shape how Limiance looks, keeps you informed, and handles your
              trading activity.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 max-[640px]:w-full">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <MdOutlineSettings size={21} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/45">Signed in as</p>
              <p className="max-w-[190px] truncate text-sm font-semibold text-white">
                {user?.username || "Your account"}
              </p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-white/45">
              {settingsQuery.isSuccess ? (
                <MdOutlineCheckCircle className="text-emerald-400" size={15} />
              ) : (
                <MdOutlineNotificationsActive className="text-white/35" size={15} />
              )}
              {settingsQuery.isLoading
                ? "Loading"
                : settingsQuery.isError
                  ? "Offline"
                  : "Loaded"}
            </span>
          </div>
        </div>
      </section>

      {settingsQuery.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/80"
        >
          <span>
            We couldn’t load your saved preferences. Displayed summaries may be
            incomplete.
          </span>
          <button
            type="button"
            onClick={() => void settingsQuery.refetch()}
            className="font-semibold text-amber-200 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      <section className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2 px-1">
          <MdOutlineSettings className="text-primary" size={18} />
          <h2 className="text-sm font-semibold text-white/85">
            Account preferences
          </h2>
          <span className="h-px flex-1 bg-white/[0.07]" />
        </div>
        <div className="flex flex-col gap-4">
          {settingsList.map((item, index) => (
            <div
              key={item.title || index}
              className="animate-fade-in-up"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "both",
              }}
            >
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
      </section>
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
