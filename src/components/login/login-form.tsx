"use client";

import { TextInput, PasswordInput, Button, Divider } from "@mantine/core";
import { useAuth } from "@/src/hooks/queries/use-auth";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef } from "react";
import type { GeeTestValidateResult } from "react-geetest-v4";
import type { Login } from "@/src/types/auth";
import { Google } from "../icons/google";
import { useGoogleLogin } from "@react-oauth/google";

const CaptchaButton = dynamic(
  () => import("./captcha-button").then((m) => m.CaptchaButton),
  { ssr: false }
);

const captchaId = process.env.NEXT_PUBLIC_GEETEST_CAPTCHA_ID;

const inputStyles = {
  input:
    "border !border-gray-9 hover:!border-white/30 focus:!border-primary focus-within:!border-primary focus:!shadow-[0_0_12px_rgba(77,119,240,0.15)] focus-within:!shadow-[0_0_12px_rgba(77,119,240,0.15)] !h-55px !rounded-xl !text-white !bg-transparent transition-all duration-300",
  label: "!text-sm !text-white/55",
};

export const LoginForm = () => {
  const { loginForm: form, submitLogin, loginLoading } = useAuth();

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log(tokenResponse.access_token);
    },
    onError: () => {
      console.log("Login Failed");
    },
  });

  const showCaptchaRef = useRef<(() => void) | null>(null);
  const pendingLoginValues = useRef<Login | null>(null);
  const captchaBusy = useRef(false);

  const submitLoginWithCaptcha = (values: Login) => {
    if (!captchaId) {
      submitLogin(values);
      return;
    }

    if (captchaBusy.current) return; // challenge already open — ignore re-entrancy

    if (!showCaptchaRef.current) {
      // Captcha SDK not initialised yet (async script load) — fail open so
      // login can't dead-end silently; the backend still rate-limits.
      submitLogin(values);
      return;
    }

    captchaBusy.current = true;
    pendingLoginValues.current = values; // hold values while challenge runs
    showCaptchaRef.current();            // open the captcha
  };

  const handleCaptchaSuccess = (result?: GeeTestValidateResult) => {
    captchaBusy.current = false;
    const values = pendingLoginValues.current;
    pendingLoginValues.current = null;
    if (!values) return;

    const rawGenTime =
      result?.gen_time ??
      (result as Record<string, unknown> | undefined)?.genTime;

    const payload: Login = {
      ...values,
      lotNumber: result?.lot_number,
      captchaOutput: result?.captcha_output,
      passToken: result?.pass_token,
      genTime:
        rawGenTime !== undefined && rawGenTime !== null
          ? String(rawGenTime)
          : undefined,
    };

    submitLogin(payload);
  };

  const handleCaptchaClose = () => {
    captchaBusy.current = false;
    pendingLoginValues.current = null;
  };

  const handleShowCaptcha = (show: () => void) => {
    showCaptchaRef.current = show;
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={form.onSubmit(submitLoginWithCaptcha)} className="flex flex-col gap-10px">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-6">
            <TextInput
              classNames={inputStyles}
              label="Email / Number"
              type="text"
              placeholder="Enter email or phone"
              {...form.getInputProps("emailOrPhone")}
            />
            <div className="flex flex-col gap-4">
              <PasswordInput
                classNames={inputStyles}
                label="Password"
                placeholder="Password"
                {...form.getInputProps("password")}
              />
              {/* <Checkbox
                label="Remember me"
                checked={form.values.rememberMe}
                onChange={(e) =>
                  form.setFieldValue("rememberMe", e.target.checked)
                }
              /> */}
            </div>
            <Button
              type="submit"
              className="!h-55px !rounded-25px !bg-primary hover:!bg-primary/90 hover:!shadow-[0_0_15px_rgba(77,119,240,0.3)] !transition-all active:!scale-[0.98]"
              fullWidth
              loading={loginLoading}
            >
              Log in
            </Button>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-primary cursor-pointer font-medium"
          >
            Forgot your password?
          </Link>
        </div>
        <Divider
          label="Or login with"
          classNames={{
            label:
              "before:!border-t-white/20 after:!border-t-white/20 !text-white",
          }}
          labelPosition="center"
        />
      </form>
      <button
        type="button"
        onClick={() => loginWithGoogle()}
        className="flex items-center justify-center gap-3 w-full h-[55px] bg-[#181a20] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition-colors rounded-xl"
      >
        <Google />
        <span className="text-white/80 font-bold text-sm">Log In with Google</span>
      </button>

      {captchaId ? (
        <CaptchaButton
          captchaId={captchaId}
          onSuccess={handleCaptchaSuccess}
          onShowCaptcha={handleShowCaptcha}
          onClose={handleCaptchaClose}
        />
      ) : null}
    </div>
  );
};
