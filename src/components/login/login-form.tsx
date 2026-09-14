"use client";

import { TextInput, PasswordInput, Button, Divider } from "@mantine/core";
import { useAuth } from "@/src/hooks/queries/use-auth";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";

const inputStyles = {
  input:
    "border !border-gray-9 hover:!border-white/30 focus:!border-primary focus-within:!border-primary focus:!shadow-[0_0_12px_rgba(77,119,240,0.15)] focus-within:!shadow-[0_0_12px_rgba(77,119,240,0.15)] !h-55px !rounded-xl !text-white !bg-transparent transition-all duration-300",
  label: "!text-sm !text-white/55",
};

export const LoginForm = () => {
  const { loginForm: form, handleLogin, loginLoading } = useAuth();



  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleLogin} className="flex flex-col gap-60px">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-10">
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
      {/* <button
        type="button"
        className="flex shadow-4 rounded-6px py-5 px-10 w-full bg-gray-8 items-center justify-between"
      >
        <Google />
        <span className="text-white font-medium">Log In with Google</span>
        <span />
      </button> */}
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <GoogleLogin
          size="large"
          text="continue_with"
          width={400}
          theme="filled_black"
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential)
              console.log(credentialResponse.credential);
          }}
          onError={() => {
            console.log("Login Failed");
          }}
        />
      )}
    </div>
  );
};
