import { Secure } from "@/src/components/icons/secure";
import VerifyIcon from "@/public/verify-icon.png";
import Pattern from "@/public/pattern.png";
import Image from "next/image";
import Link from "next/link";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { VerifyIdentityPageSkeleton } from "@/src/components/skeletons";

const instructions = [
  "Identity Documents and Facial Verification",
  "Personal Information",
];

function VerifyIdentity() {
  return (
    <main className="flex items-center justify-center min-h-hero relative bg-verifyIdentityBg bg-cover bg-no-repeat">
      <div className="flex w-full flex-col max-w-634px gap-10">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col">
            <div className="relative w-fit h-fit self-center">
              <p className="text-white/65 w-fit border-b border-b-white/65 pb-1 absolute text-center inset-x-0 top-0">
                How do I verify an individual account?
              </p>
              <Image
                src={VerifyIcon}
                alt="Verify icon"
                width={303}
                height={303}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-bold-20 self-center">Verify your identity</h2>
              <p className="py-10px relative">
                To ensure the security of your account and comply with
                regulations, we require users to complete verification process
                <div className="absolute inset-x-0 flex justify-center -bottom-5">
                  <Image
                    src={Pattern}
                    alt="Pattern icon"
                    width={100}
                    height={70}
                  />
                </div>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <p className="font-bold">You&apos;ll need to provide your:</p>
            <ul className="flex flex-col gap-2">
              {instructions.map((item, index) => (
                <li key={index} className="flex items-center gap-10px">
                  <svg
                    width="6"
                    height="7"
                    viewBox="0 0 6 7"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="3" cy="3.38135" r="3" fill="#4D77F0" />
                  </svg>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 self-center">
            <Secure />
            <span className="text-xs text-white/55">
              Your information is only used for identity verification.
            </span>
          </span>
          <Link href="/auth/verify-identity/start">
            <button className="w-full rounded-full py-23px bg-primary text-base font-semibold">
              Verify now
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyIdentityPage() {
  return (
    <PageSuspense fallback={<VerifyIdentityPageSkeleton />}>
      <VerifyIdentity />
    </PageSuspense>
  );
}
