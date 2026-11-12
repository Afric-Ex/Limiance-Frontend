"use client";

import { Secure } from "@/src/components/icons/secure";
import VerifyIcon from "@/public/verify-icon.png";
import Pattern from "@/public/pattern.png";
import Image from "next/image";
import Link from "next/link";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { VerifyIdentityPageSkeleton } from "@/src/components/skeletons/auth";
import { HeroDecorations } from "@/src/components/shared/hero-decorations";
import { AuthMobileBrand } from "@/src/components/shared/auth-mobile-brand";
import { useTranslations } from "next-intl";

const instructionKeys = [
  "identityDocumentsAndFace",
  "personalInformation",
];

function VerifyIdentity() {
  const t = useTranslations("Auth");
  return (
    <main className="flex items-center justify-center overflow-x-hidden px-4 min-h-hero relative bg-verifyIdentityBg bg-cover bg-no-repeat">
      <HeroDecorations />
      <div className="flex w-full flex-col max-w-634px gap-10">
        <AuthMobileBrand className="mb-0" />
        <div className="flex flex-col gap-10">
          <div className="flex flex-col">
            <div className="relative w-fit h-fit self-center">
              <p className="text-white/65 w-fit border-b border-b-white/65 pb-1 absolute text-center inset-x-0 top-0">
                {t("verifyIndividualAccount")}
              </p>
              <Image
                src={VerifyIcon}
                alt={t("verifyIconAlt")}
                width={303}
                height={303}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold self-center">{t("verifyYourIdentity")}</h2>
              <p className="py-10px relative">
                {t("verificationRequirement")}
                <div className="absolute inset-x-0 flex justify-center -bottom-5">
                  <Image
                    src={Pattern}
                    alt={t("patternIconAlt")}
                    width={100}
                    height={70}
                  />
                </div>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <p className="font-bold">{t("youWillNeedToProvide")}</p>
            <ul className="flex flex-col gap-2">
              {instructionKeys.map((item, index) => (
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
                  <span className="text-sm">{t(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 self-center">
            <Secure />
            <span className="text-xs text-white/55">
              {t("infoUsedForVerificationOnly")}
            </span>
          </span>
          <Link href="/auth/verify-identity/start">
            <button className="w-full rounded-full py-23px bg-primary text-base font-semibold">
              {t("verifyNow")}
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
