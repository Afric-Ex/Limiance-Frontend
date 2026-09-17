import { Skeleton } from "@/src/components/shared/skeleton";
import { SkeletonField } from "@/src/components/skeletons/shared";

/**
 * Auth & onboarding page skeletons.
 * Mirrors the two real auth layouts: the split illustration+form grid
 * (login / signup / forgot / reset / verify-email / signup-profile) and
 * the centered card (2FA, verify-identity, KYC start, KYC pending).
 */

const splitGrid =
  "flex items-center overflow-auto px-4 justify-center min-h-hero relative bg-black max-[1150px]:bg-black";
const imagePanel = "hidden sm:block w-full h-[523px] min-[1150px]:max-w-[429px]";
const rightCol = "flex flex-col w-full max-w-[460px] max-[1150px]:mx-auto gap-8";

const centeredCol =
  "flex items-center justify-center px-4 min-h-hero bg-black";

/** Two-column split auth screen (illustration left, form right). */
export function AuthSplitSkeleton({
  fields = 4,
  titleWidth = 260,
  withButton = true,
}: {
  fields?: number;
  titleWidth?: number;
  withButton?: boolean;
}) {
  return (
    <main className={splitGrid}>
      <div className="grid max-w-auth grid-cols-1 sm:grid-cols-2 gap-5 w-full items-center">
        <div className={imagePanel}>
          <Skeleton variant="rect" width="100%" height={523} />
        </div>
        <div className={rightCol}>
          <Skeleton variant="text" width={titleWidth} height={40} />
          <Skeleton variant="text" width={titleWidth * 0.55} height={14} />
          <div className="flex flex-col gap-4 w-full">
            {Array.from({ length: fields }).map((_, i) => (
              <SkeletonField key={i} labelWidth={72} />
            ))}
            {withButton && (
              <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl mt-1" />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/** Centered single-card auth screen. */
export function AuthCardSkeleton({
  fields = 4,
  titleWidth = 220,
  subWidth = 180,
  pin = false,
  buttonWidth = 220,
  withButton = true,
}: {
  fields?: number;
  titleWidth?: number;
  subWidth?: number;
  pin?: boolean;
  buttonWidth?: number;
  withButton?: boolean;
}) {
  return (
    <main className={centeredCol}>
      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        <div className="flex flex-col items-center gap-2 w-full">
          <Skeleton variant="text" width={titleWidth} height={30} />
          <Skeleton variant="text" width={subWidth} height={14} />
        </div>
        {pin ? (
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rect" width={48} height={56} className="!rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {Array.from({ length: fields }).map((_, i) => (
              <SkeletonField key={i} labelWidth={72} />
            ))}
          </div>
        )}
        {withButton && (
          <Skeleton variant="rect" width={buttonWidth} height={52} className="!rounded-xl" />
        )}
      </div>
    </main>
  );
}

export function LoginPageSkeleton() {
  return <AuthSplitSkeleton fields={4} titleWidth={300} />;
}

export function SignUpPageSkeleton() {
  return <AuthSplitSkeleton fields={6} titleWidth={340} />;
}

export function SignUpProfilePageSkeleton() {
  return <AuthSplitSkeleton fields={8} titleWidth={380} />;
}

export function ForgotPasswordPageSkeleton() {
  return <AuthSplitSkeleton fields={2} titleWidth={280} />;
}

export function ResetPasswordPageSkeleton() {
  return <AuthSplitSkeleton fields={3} titleWidth={300} />;
}

export function VerifyEmailPageSkeleton() {
  return <AuthSplitSkeleton fields={2} titleWidth={280} />;
}

export function Verify2FAPageSkeleton() {
  return <AuthCardSkeleton pin titleWidth={320} subWidth={240} />;
}

export function VerifyIdentityPageSkeleton() {
  return (
    <main className={centeredCol}>
      <div className="flex flex-col w-full max-w-[634px] gap-10 px-4">
        <div className="flex flex-col items-center gap-5">
          <Skeleton variant="circle" size={140} />
          <Skeleton variant="text" width={260} height={28} />
          <Skeleton variant="text" width={420} height={14} />
          <Skeleton variant="text" width={340} height={14} />
        </div>
        <div className="flex flex-col gap-3 items-center w-full">
          <Skeleton variant="text" width={200} height={14} />
          <Skeleton variant="text" width={240} height={14} />
          <Skeleton variant="text" width={180} height={14} />
        </div>
        <Skeleton variant="rect" width="100%" height={56} className="!rounded-full" />
        <div className="flex items-center justify-center gap-2">
          <Skeleton variant="circle" size={20} />
          <Skeleton variant="text" width={280} height={12} />
        </div>
      </div>
    </main>
  );
}

export function VerifyIdentityStartPageSkeleton() {
  return (
    <main className="flex flex-col gap-12 min-h-hero pt-10 bg-black">
      <div className="flex max-w-[1199px] w-11/12 mx-auto flex-col gap-4">
        <Skeleton variant="text" width={260} height={26} />
        <Skeleton variant="text" width={360} height={34} />
      </div>
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-6 max-w-md w-full px-4">
          <Skeleton variant="text" width={340} height={14} />
          <Skeleton variant="text" width={300} height={14} />
          <Skeleton variant="rect" width="100%" height={52} className="!rounded-lg" />
        </div>
      </div>
    </main>
  );
}

export function VerifyIdentityPendingPageSkeleton() {
  return (
    <main className={centeredCol}>
      <div className="flex flex-col items-center gap-6 max-w-md w-full px-4">
        <Skeleton variant="circle" size={120} />
        <Skeleton variant="text" width={280} height={26} />
        <Skeleton variant="text" width={360} height={14} />
        <Skeleton variant="text" width={320} height={14} />
        <Skeleton variant="rect" width={200} height={52} className="!rounded-xl" />
      </div>
    </main>
  );
}

/** Generic auth loading fallback — heading + form. */
export function AuthPageSkeleton() {
  return <AuthSplitSkeleton fields={4} />;
}