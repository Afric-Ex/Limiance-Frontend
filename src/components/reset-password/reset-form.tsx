"use client";

import { Button, PasswordInput } from "@mantine/core";
import { useAuth } from "@/src/hooks/queries/use-auth";
import { Info } from "@/src/components/icons/info";
import { useTranslations } from "next-intl";

const inputStyles = {
  input:
    "border !border-gray-9 focus:!border-primary focus-within:!border-primary !h-55px !rounded-xl !text-white !bg-transparent duration-200",
  label: "!text-base !font-medium !text-white",
};

export const ResetPasswordForm = () => {
  const t = useTranslations("Auth");
  const { resetForm, resetLoading, handleResetPassword } = useAuth();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-60px">
        <div className="flex flex-col gap-5">
          <form onSubmit={handleResetPassword} className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <PasswordInput
                classNames={inputStyles}
                label={t("password")}
                placeholder={t("passwordPlaceholder")}
                {...resetForm.getInputProps("password")}
              />
              <PasswordInput
                classNames={inputStyles}
                label={t("confirmPassword")}
                placeholder={t("confirmPasswordPlaceholder")}
                {...resetForm.getInputProps("confirmPassword")}
              />
              <div className="text-warning-1 bg-gray-47 rounded-xl px-4 py-3 text-xs leading-relaxed flex items-start gap-2">
                <Info className="shrink-0 mt-0.5" />
                <span>
                  {t("resetSecurityWarning")}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="!h-55px !rounded-25px !bg-primary"
              fullWidth
              loading={resetLoading}
            >
              {t("resetPassword")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
