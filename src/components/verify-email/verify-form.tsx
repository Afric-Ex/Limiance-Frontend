"use client";

import { useAuth } from "@/src/hooks/queries/use-auth";
import { successNotification } from "@/src/lib/notification-handler";
import { auth } from "@/src/services/auth";
import { Button, LoadingOverlay, PinInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";

export const VerifyForm = () => {
  const { handleVerify, otpForm, emailOrPhone, verifyLoading } = useAuth();

  const { mutate: forgotPassword, isPending: forgotLoading } = useMutation({
    mutationFn: () =>
      auth.forgotPassword({
        email: emailOrPhone as string,
      }),
    onSuccess: () => {
      successNotification("OTP resent");
    },
  });

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-10">
      <div className="flex flex-col gap-30px">
        <p className="sm:text-base text-sm">
          A 6-digit verification code has just been sent to{" "}
          <span className="text-primary">{emailOrPhone}</span>
        </p>
        <div className="flex flex-col gap-6">
          <span className="font-medium sm:text-base text-sm">Enter Verification Code</span>
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
          Verify
        </Button>
        <span className="self-center">
          Didn&apos;t receive email?{" "}
          <span
            onClick={() => forgotPassword()}
            className="text-primary hover:text-primary/50 cursor-pointer underline font-bold"
          >
            Resend
          </span>
        </span>
      </div>
      <LoadingOverlay visible={forgotLoading} />
    </form>
  );
};
