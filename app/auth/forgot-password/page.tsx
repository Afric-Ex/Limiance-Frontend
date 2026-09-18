import Image from "next/image";
import LoginImage from "@/public/login-image.png";
import { ForgotPasswordForm } from "@/src/components/forgot-password/forgot-form";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { ForgotPasswordPageSkeleton } from "@/src/components/skeletons/auth";
import { HeroDecorations } from "@/src/components/shared/hero-decorations";
import { AuthMobileBrand } from "@/src/components/shared/auth-mobile-brand";

function ForgotPassword() {
  return (
    <main className="flex items-center overflow-auto justify-center px-4 min-h-hero relative bg-landing bg-cover bg-no-repeat animate-fade-in max-[1150px]:bg-none max-[1150px]:bg-black page-enter">
      <HeroDecorations />
      <div className="grid max-w-auth h-full overflow-auto grid-cols-1 sm:grid-cols-2 gap-5 w-full items-center animate-fade-in max-[1150px]:flex max-[1150px]:flex-col max-[1150px]:justify-center">
        
        <AuthMobileBrand />

        <Image
          src={LoginImage}
          alt="ForgotPassword image"
          className="max-w-429px min-[1150px]:inline-block hidden w-full"
          width={429}
          height={523}
        />
        <div className="flex flex-col max-w-416px w-full max-sm:mx-auto min-[1150px]:ml-auto gap-8 max-[1150px]:gap-6">
          <h2 className="md:text-45px sm:text-36px text-2xl font-bold max-[1150px]:text-center">
            Forgot Password
          </h2>
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <PageSuspense fallback={<ForgotPasswordPageSkeleton />}>
      <ForgotPassword />
    </PageSuspense>
  );
}
