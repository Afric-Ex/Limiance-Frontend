"use client";

import { useAuth } from "@/src/hooks/queries/use-auth";
import { successNotification } from "@/src/lib/notification-handler";
import { auth } from "@/src/services/auth";
import { Button, LoadingOverlay, PinInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { maskIdentifier } from "@/src/utils/mask-identifier";
import { useTranslations } from "next-intl";

export const VerifyForm = () => {
  const t = useTranslations("Auth");
  const { handleVerify, otpForm, emailOrPhone, verifyLoading } = useAuth();

  const { mutate: forgotPassword, isPending: forgotLoading } = useMutation({
    mutationFn: () =>
      auth.forgotPassword({
        email: emailOrPhone as string,
      }),
    onSuccess: () => {
      successNotification(t("otpResent"));
    },
  });

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-10">
      <div className="flex flex-col gap-30px">
        <p className="sm:text-base text-sm">
          {t("otpSentTo")}{" "}
          <span className="text-primary">{maskIdentifier(emailOrPhone ?? "")}</span>
        </p>
        <div className="flex flex-col gap-6">
          <span className="font-medium sm:text-base text-sm">{t("enterVerificationCode")}</span>
          <PinInput
            styles={{
              root: {
                display: "grid",
                gridTemplateColumns: "repeat(6,1fr)",
                gap: "12px",
              },
              pinInput: {
                width: "100%",
                height: "auto",
                aspectRatio: "1/1",
              },
              input: {
                width: "100%",
                height: "100%",
                background: "transparent",
                borderRadius: "12px",
              },
            }}
            classNames={{
              input:
                "focus:!border-primary !duration-200 !text-2xl !font-semibold",
            }}
            length={6}
            placeholder=""
            {...otpForm.getInputProps("otp")}
          />
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <Button
          type="submit"
          className="!h-55px !rounded-25px !bg-primary"
          fullWidth
          loading={verifyLoading}
        >
          {t("verify")}
        </Button>
        <span className="self-center">
          {t("didntReceiveEmail")}{" "}
          <span
            onClick={() => forgotPassword()}
            className="text-primary hover:text-primary/50 cursor-pointer underline font-bold"
          >
            {t("resend")}
          </span>
        </span>
      </div>
      <LoadingOverlay visible={forgotLoading} />
    </form>
  );
};
