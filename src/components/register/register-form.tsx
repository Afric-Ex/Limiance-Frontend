"use client";

import {
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Divider,
} from "@mantine/core";
import Link from "next/link";
import React, { useState } from "react";
import { Google } from "../icons/google";
import { useAuth } from "@/src/hooks/queries/use-auth";

const inputStyles = {
  input:
    "!bg-transparent !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[55px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20",
  label: "!text-sm !font-semibold !text-white/70 !mb-1.5",
  visibilityToggle: "!text-white/40 hover:!text-white hover:!bg-white/[0.04] !rounded-md"
};

export const RegisterForm = () => {
  const [isAgreed, setIsAgreed] = useState(false);
  const { handleRegister, registerLoading, registerForm: form } = useAuth();

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4 animate-fade-in-up">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <TextInput
              classNames={inputStyles}
              label="First Name"
              placeholder="Enter your first name"
              {...form.getInputProps("firstName")}
            />
            <TextInput
              classNames={inputStyles}
              label="Last Name"
              placeholder="Enter your last name"
              {...form.getInputProps("lastName")}
            />
            <TextInput
              classNames={inputStyles}
              label="Username"
              placeholder="Enter your username"
              {...form.getInputProps("username")}
            />
            <TextInput
              classNames={inputStyles}
              label="Phone"
              placeholder="e.g. 2348012345678 (no + prefix)"
              {...form.getInputProps("phone")}
            />
            <TextInput
              classNames={inputStyles}
              label="Email"
              type="email"
              placeholder="Email"
              {...form.getInputProps("email")}
            />
            <PasswordInput
              classNames={inputStyles}
              label="Password"
              placeholder="Enter your password"
              {...form.getInputProps("password")}
            />
            <PasswordInput
              classNames={inputStyles}
              label="Confirm Password"
              placeholder="Confirm your password"
              {...form.getInputProps("confirmPassword")}
            />
            <div className="flex items-start gap-3 mt-2">
              <Checkbox
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                classNames={{
                  input: "!bg-white/[0.04] !border-white/[0.2] checked:!bg-primary checked:!border-primary !cursor-pointer !w-5 !h-5 !rounded !mt-0.5",
                  inner: "!w-5 !h-5"
                }}
              />
              <span className="text-sm font-medium text-white/70 leading-relaxed">
                By creating an account, I agree to Limiance&apos;s{" "}
                <Link href="#" className="text-primary hover:text-primary/80 transition-colors">
                  User Agreement, Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-primary hover:text-primary/80 transition-colors">
                  Privacy Policy
                </Link>
              </span>
            </div>
          </div>
          <Button
            disabled={!isAgreed}
            type="submit"
            className="!h-[55px] !rounded-xl !bg-primary hover:!bg-primary/90 hover:!shadow-[0_0_16px_rgba(77,119,240,0.3)] !text-white !font-bold !transition-all active:!scale-[0.98] disabled:!bg-white/[0.04] disabled:!text-white/30"
            fullWidth
            loading={registerLoading}
          >
            Register
          </Button>
        </div>
        
        <span className="self-center text-sm font-medium text-white/50 mt-2">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:text-primary/80 transition-colors ml-1">
            Log In
          </Link>
        </span>
        
        <Divider
          label={<span className="text-white/40 text-xs uppercase tracking-widest font-semibold px-2">Or continue with</span>}
          classNames={{
            label: "before:!border-t-white/[0.08] after:!border-t-white/[0.08]",
            root: "!my-2"
          }}
          labelPosition="center"
        />
      </div>
      
      <button
        type="button"
        className="flex items-center justify-center gap-3 w-full h-[55px] bg-[#181a20] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition-colors rounded-xl"
      >
        <Google />
        <span className="text-white/80 font-bold text-sm">Log In with Google</span>
      </button>
    </form>
  );
};
