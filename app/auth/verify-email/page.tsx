import Image from "next/image";
import VerifyImage from "@/public/verify-image.png";
import { VerifyForm } from "@/src/components/verify-email/verify-form";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { VerifyEmailPageSkeleton } from "@/src/components/skeletons/auth";
import { HeroDecorations } from "@/src/components/shared/hero-decorations";
import { AuthMobileBrand } from "@/src/components/shared/auth-mobile-brand";

function VerifyEmail() {
  return (
    <main className="flex items-center justify-center px-4 min-h-hero relative bg-landing bg-cover bg-no-repeat animate-fade-in max-[1150px]:bg-none max-[1150px]:bg-black page-enter">
      <HeroDecorations />
      <div className="grid max-w-auth grid-cols-1 sm:grid-cols-2 gap-5 w-full items-center animate-fade-in max-[1150px]:flex max-[1150px]:flex-col max-[1150px]:justify-center">
        
        <AuthMobileBrand />

        <Image
          src={VerifyImage}
          alt="verify image"
          className="max-w-429px min-[1150px]:inline-block hidden w-full"
          width={429}
          height={523}
        />
        <div className="flex flex-col max-w-416px w-full max-sm:mx-auto min-[1150px]:ml-auto gap-7 max-[1150px]:gap-6">
          <h2 className="md:text-45px sm:text-36px text-2xl font-bold max-[1150px]:text-center">
            Verify <span className="text-primary">Email</span>
          </h2>
          <VerifyForm />
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <PageSuspense fallback={<VerifyEmailPageSkeleton />}>
      <VerifyEmail />
    </PageSuspense>
  );
}
