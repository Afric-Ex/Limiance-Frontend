import Image from "next/image";
import SignupImage from "@/public/signup-image.png";
import { RegisterForm } from "@/src/components/register/register-form";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SignUpProfilePageSkeleton } from "@/src/components/skeletons/auth";
import { HeroDecorations } from "@/src/components/shared/hero-decorations";
import { AuthMobileBrand } from "@/src/components/shared/auth-mobile-brand";

function Profile() {
  return (
    <main className="flex items-center flex-1 overflow-auto px-4 justify-center py-10 relative bg-landing bg-cover bg-no-repeat">
      <HeroDecorations />
      <div className="grid h-full overflow-auto max-w-auth grid-cols-1 sm:grid-cols-2 gap-3 w-full items-start">
        <AuthMobileBrand />
        <Image
          src={SignupImage}
          alt="Profile image"
          className="max-w-429px sm:inline-block hidden w-full"
          width={429}
          height={523}
        />
        <div className="flex flex-col max-w-460px w-full max-sm:mx-auto sm:ml-auto gap-8 animate-fade-in-up">
          <div className="flex flex-col gap-2">
            <h2 className="md:text-[45px] sm:text-[36px] text-3xl font-bold tracking-tight">
              Welcome to <span className="text-primary">Limiance</span>
            </h2>
            <p className="sm:text-lg text-base text-white/50 font-medium">Please enter your personal details</p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <PageSuspense fallback={<SignUpProfilePageSkeleton />}>
      <Profile />
    </PageSuspense>
  );
}
