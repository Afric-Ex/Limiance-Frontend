"use client";

import { Button, PasswordInput } from "@mantine/core";
import { useAuth } from "@/src/hooks/queries/use-auth";

const inputStyles = {
  input:
    "border !border-gray-9 focus:!border-primary focus-within:!border-primary !h-55px !rounded-xl !text-white !bg-transparent duration-200",
  label: "!text-base !font-medium !text-white",
};

export const ResetPasswordForm = () => {
  const { resetForm, resetLoading, handleResetPassword } = useAuth();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-60px">
        <div className="flex flex-col gap-5">
          <form onSubmit={handleResetPassword} className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <PasswordInput
                classNames={inputStyles}
                label="Password"
                placeholder="Enter your password"
                {...resetForm.getInputProps("password")}
              />
              <PasswordInput
                classNames={inputStyles}
                label="Confirm Password"
                placeholder="Enter your password"
                {...resetForm.getInputProps("confirmPassword")}
              />
            </div>

            <Button
              type="submit"
              className="!h-55px !rounded-25px !bg-primary"
              fullWidth
              loading={resetLoading}
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
