"use client";

import Image from "next/image";
import SignupImage from "@/public/signup-image.png";
import { Button, Checkbox, Select } from "@mantine/core";
import Link from "next/link";
import { countryData } from "@/src/utils/countries";
import { useState } from "react";
import { useAuthStore } from "@/src/stores/auth-store";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SignUpPageSkeleton } from "@/src/components/skeletons";

function SignUp() {
  const [isAgreed, setIsAgreed] = useState(false);
  const country = useAuthStore((state) => state.country);
  const setCountry = useAuthStore((state) => state.setCountry);

  return (
    <main className="flex items-center flex-1 overflow-auto px-4 justify-center min-h-hero relative bg-landing bg-cover bg-no-repeat animate-fade-in max-[1150px]:bg-none max-[1150px]:bg-black page-enter">
      <div className="grid max-w-auth grid-cols-1 sm:grid-cols-2 gap-5 w-full items-center animate-fade-in max-[1150px]:flex max-[1150px]:flex-col max-[1150px]:justify-center">
        
        {/* Mobile Logo Header */}
        <div className="min-[1150px]:hidden flex flex-col items-center justify-center gap-4 mb-8 w-full">
          <Image src="/logo.png" alt="Limiance" width={48} height={48} className="w-12 h-12" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Limiance Exchange</h1>
        </div>

        <Image
          src={SignupImage}
          alt="Sign up image"
          className="max-w-429px min-[1150px]:inline-block hidden w-full"
          width={429}
          height={523}
        />
        <div className="flex flex-col max-w-460px w-full max-sm:mx-auto min-[1150px]:ml-auto gap-7 max-[1150px]:gap-6">
          <h2 className="md:text-45px sm:text-36px text-2xl font-bold max-[1150px]:text-center">
            Welcome to <span className="text-primary">Limiance</span>
          </h2>
          <form onSubmit={() => {}} className="flex flex-col gap-10">
            <div className="flex flex-col gap-30px">
              <div className="flex flex-col gap-6">
                <h2 className="sm:text-xl text-base font-bold">
                  To Get Started
                </h2>
                <p className="sm:text-base text-sm text-white/70">
                  Select the country/region that exactly matches the one on your
                  ID or proof of address
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <Select
                  data={countryData.map((item) => item.value)}
                  classNames={{
                    input:
                      "border !border-gray-9 focus:!border-primary focus-within:!border-primary !h-55px !rounded-xl !text-white !bg-transparent duration-200",
                    label: "!text-sm !text-white",
                  }}
                  label="Country/region"
                  placeholder="Select country/region"
                  searchable
                  value={country}
                  onChange={(value) => {
                    if (!value) return;
                    setCountry(value);
                  }}
                />
                <span className="flex items-start gap-2">
                  <Checkbox
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    classNames={{ input: "!border-white/20 checked:!bg-primary" }}
                  />
                  <span className="text-white/70 text-sm">
                    By creating an account, I agree to Limiance{" "}
                    <span className="text-primary underline">
                      User Agreement, Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="text-primary underline">
                      Privacy Policy
                    </span>
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <Button
                component={Link}
                href={!isAgreed || !country ? "" : "/auth/signup/profile"}
                className="!h-[52px] !rounded-xl disabled:!bg-gray-9 !bg-primary hover:!bg-primary/90 transition-colors"
                fullWidth
                disabled={!isAgreed || !country}
              >
                Next
              </Button>
              <span className="self-center text-sm text-white/70">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary underline font-bold"
                >
                  Log In
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <PageSuspense fallback={<SignUpPageSkeleton />}>
      <SignUp />
    </PageSuspense>
  );
}
