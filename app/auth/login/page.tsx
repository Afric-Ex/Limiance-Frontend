import Image from "next/image";
import LoginImage from "@/public/login-image.png";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/login.module.css";
import { LoginForm } from "@/src/components/login/login-form";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { LoginPageSkeleton } from "@/src/components/skeletons/auth";
import { HeroDecorations } from "@/src/components/shared/hero-decorations";

function Login() {
  return (
    <main className="flex items-center overflow-auto px-4 justify-center min-h-hero relative bg-landing bg-cover bg-no-repeat animate-fade-in max-[1150px]:bg-none max-[1150px]:bg-black page-enter">
      <HeroDecorations />
      <div className="grid max-w-auth h-full overflow-auto grid-cols-1 sm:grid-cols-2 gap-5 w-full items-center animate-fade-in max-[1150px]:flex max-[1150px]:flex-col max-[1150px]:justify-center">
        
        {/* Mobile Logo Header */}
        <div className="min-[1150px]:hidden flex flex-col items-center justify-center gap-4 mb-8 w-full">
          <Image src="/logo.png" alt="Limiance" width={48} height={48} className="w-12 h-12" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Limiance Exchange</h1>
        </div>

        <Image
          src={LoginImage}
          alt="Login image"
          className="max-w-429px min-[1150px]:inline-block hidden w-full"
          width={429}
          height={523}
        />
        <div className="flex flex-col max-w-416px w-full max-sm:mx-auto min-[1150px]:ml-auto gap-8 max-[1150px]:gap-6">
          <h2 className="md:text-45px sm:text-36px text-2xl font-bold max-[1150px]:text-center">
            Welcome <span className="text-primary">Back</span>
          </h2>
          <Tabs classNames={classes} defaultValue="email">
            <TabsList className="max-[1150px]:justify-center">
              <TabsTab value="email">Email/Mobile</TabsTab>
              <TabsTab disabled value="subaccount">Sub-account</TabsTab>
            </TabsList>
            <TabsPanel value="email">
              <LoginForm />
            </TabsPanel>
            <TabsPanel value="subaccount">
              <LoginForm />
            </TabsPanel>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <PageSuspense fallback={<LoginPageSkeleton />}>
      <Login />
    </PageSuspense>
  );
}
