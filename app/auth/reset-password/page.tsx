import Image from "next/image";
import ResetImage from "@/public/reset-image.png";
import { ResetPasswordForm } from "@/src/components/reset-password/reset-form";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { ResetPasswordPageSkeleton } from "@/src/components/skeletons/auth";
import { HeroDecorations } from "@/src/components/shared/hero-decorations";

function ResetPassword() {
  return (
    <main className="flex items-center overflow-auto justify-center px-4 min-h-hero relative bg-landing bg-cover bg-no-repeat animate-fade-in max-[1150px]:bg-none max-[1150px]:bg-black page-enter">
      <HeroDecorations />
      <div className="grid max-w-auth h-full overflow-auto grid-cols-1 sm:grid-cols-2 gap-5 w-full items-center animate-fade-in max-[1150px]:flex max-[1150px]:flex-col max-[1150px]:justify-center">
        
        {/* Mobile Logo Header */}
        <div className="min-[1150px]:hidden flex flex-col items-center justify-center gap-4 mb-8 w-full">
          <Image src="/logo.png" alt="Limiance" width={48} height={48} className="w-12 h-12" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Limiance Exchange</h1>
        </div>

        <Image
          src={ResetImage}
          alt="Reset Password image"
          className="max-w-429px min-[1150px]:inline-block hidden w-full"
          width={429}
          height={523}
        />
        <div className="flex flex-col max-w-416px w-full max-sm:mx-auto min-[1150px]:ml-auto gap-7 max-[1150px]:gap-6">
          <div className="flex flex-col gap-4 max-[1150px]:text-center">
            <h2 className="md:text-45px sm:text-36px text-2xl font-bold">Reset Password</h2>
            <p className="sm:text-xl text-base font-bold">Please Enter Your New Password</p>
          </div>
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageSuspense fallback={<ResetPasswordPageSkeleton />}>
      <ResetPassword />
    </PageSuspense>
  );
}
