import { Skeleton } from "@/src/components/shared/skeleton";
import {
  SkeletonCard,
  SkeletonField,
  SkeletonHeader,
  SkeletonShell,
  SkeletonStatGrid,
  SkeletonTable,
} from "@/src/components/skeletons/shared";

/**
 * Account centre page skeletons — one per route.
 * Mirrors the shared account layout: header + content cards/forms/tables.
 * Sidebar chrome is real (from layout); these fill the content column.
 */

const contentShell = "flex flex-col gap-6 max-w-5xl max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter";

/** Shared header block for account pages. */
const AccountHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="flex flex-col min-[1150px]:flex-row min-[1150px]:items-start justify-between gap-4 max-[1150px]:gap-3">
    <div className="flex flex-col gap-2">
      <Skeleton variant="text" width={220} height={28} />
      {subtitle && <Skeleton variant="text" width={280} height={14} />}
    </div>
    <Skeleton variant="rect" width={160} height={44} className="!rounded-xl shrink-0" />
  </div>
);

export function AccountSettingsSkeleton() {
  return (
    <main className={contentShell}>
      <AccountHeader title="Settings" subtitle="Manage your preferences" />
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-4">
          <SkeletonField labelWidth={72} />
          <SkeletonField labelWidth={72} />
          <SkeletonField labelWidth={72} />
          <SkeletonField labelWidth={72} />
        </div>
        <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl mt-1" />
      </SkeletonCard>
    </main>
  );
}

export function AccountSecuritySkeleton() {
  return (
    <main className={contentShell}>
      <AccountHeader title="Security" subtitle="Protect your account" />
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-4">
          <SkeletonField labelWidth={72} />
          <SkeletonField labelWidth={72} />
        </div>
        <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
      </SkeletonCard>
      <SkeletonCard titleWidth={180}>
        <SkeletonTable rows={4} cols={5} />
      </SkeletonCard>
      <SkeletonCard titleWidth={180}>
        <SkeletonTable rows={4} cols={5} />
      </SkeletonCard>
    </main>
  );
}

export function AccountProfileSkeleton() {
  return (
    <main className={contentShell}>
      <AccountHeader title="Profile" subtitle="Personal information" />
      <SkeletonCard className="flex items-center gap-6" titleWidth={100}>
        <Skeleton variant="circle" size={96} />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="text" width={120} height={14} />
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="text" width={80} height={12} />
                <Skeleton variant="text" width={200} height={14} />
              </div>
            ))}
          </div>
        </div>
      </SkeletonCard>
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton variant="text" width={160} height={14} />
              <Skeleton variant="text" width={120} height={14} />
            </div>
          ))}
        </div>
      </SkeletonCard>
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-4">
          <SkeletonField labelWidth={72} />
          <SkeletonField labelWidth={72} />
          <SkeletonField labelWidth={72} />
          <SkeletonField labelWidth={72} />
        </div>
        <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl mt-1" />
      </SkeletonCard>
    </main>
  );
}

export function AccountPaymentMethodsSkeleton() {
  return (
    <main className="flex flex-col gap-8 max-w-3xl max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter">
      <AccountHeader title="Payment Methods" subtitle="Manage bank accounts" />
      <SkeletonCard titleWidth={140} header={false}>
        <SkeletonTable rows={5} cols={4} />
        <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl mt-4" />
      </SkeletonCard>
    </main>
  );
}

export function AccountKycSkeleton() {
  return (
    <main className={contentShell}>
      <AccountHeader title="Identity Verification" subtitle="KYC status" />
      <SkeletonCard header={false}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" size={56} />
            <div className="flex flex-col gap-1">
              <Skeleton variant="text" width={160} height={20} />
              <Skeleton variant="text" width={120} height={14} />
            </div>
          </div>
          <Skeleton variant="rect" width="100%" height={120} className="!rounded-xl" />
        </div>
      </SkeletonCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard titleWidth={120} header={true}>
          <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
        </SkeletonCard>
        <SkeletonCard titleWidth={120} header={true}>
          <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
        </SkeletonCard>
      </div>
      <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
    </main>
  );
}

export function AccountApiKeysSkeleton() {
  return (
    <main className={contentShell}>
      <AccountHeader title="API Management" subtitle="Create and manage API keys" />
      <SkeletonCard titleWidth={100}>
        <SkeletonTable rows={6} cols={5} />
      </SkeletonCard>
    </main>
  );
}

export function AccountCreateApiKeySkeleton() {
  return (
    <main className="flex flex-col gap-5">
      <AccountHeader title="Create API Key" subtitle="Generate a new key" />
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-4">
          <SkeletonField labelWidth={72} />
          <SkeletonField labelWidth={72} />
          <div className="flex flex-col gap-2">
            <Skeleton variant="text" width={80} height={12} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton variant="rect" width={20} height={20} className="!rounded" />
                <Skeleton variant="text" width={120} height={14} />
              </div>
            ))}
          </div>
          <SkeletonField labelWidth={72} height={100} />
        </div>
        <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl mt-1" />
      </SkeletonCard>
    </main>
  );
}

/** Fallback generic account skeleton. */
export function AccountPageSkeleton() {
  return (
    <main className={contentShell}>
      <AccountHeader title="Account" subtitle="Settings" />
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-3">
          <Skeleton variant="rect" width="100%" height={48} />
          <Skeleton variant="rect" width="100%" height={48} />
        </div>
      </SkeletonCard>
      <SkeletonTable rows={4} cols={3} />
    </main>
  );
}