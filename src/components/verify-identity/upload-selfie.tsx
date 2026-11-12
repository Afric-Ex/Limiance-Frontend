"use client";

import Mannequin from "@/public/mannequin.png";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { modals } from "@mantine/modals";
import Image from "next/image";
import { SuccessModal } from "../login/verify-email-success";
import { useState } from "react";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { Loader } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { errorNotification } from "@/src/lib/notification-handler";
import { useTranslations } from "next-intl";

export const UploadSelfie = () => {
  const t = useTranslations("Kyc");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { mutate: confirmSelfie, isPending } = useMutation({
    mutationFn: async (): Promise<any> => {
      if (!selfieFile) throw new Error("No selfie selected");
      errorNotification(t("selfieUploadNotSupported"));
      throw new Error("Legacy KYC upload flow is disabled");
    },
    onSuccess: () => {
      modals.open({
        children: (
          <SuccessModal
            buttonText={t("close")}
            title={t("verificationSubmitted")}
            description={
              <div className="flex flex-col gap-2">
                <span className="text-center text-2xl">
                  {t("processingVerification")}
                </span>
                <span className="text-center text-white/55 text-base">
                  {t("verificationProcessingTime")}
                </span>
              </div>
            }
            onProceed={() => modals.closeAll()}
          />
        ),
        ...DEFAULT_MODAL_SETTINGS,
      });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const handleDrop = (files: File[]) => {
    const file = files[0];
    setSelfieFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleTakeAgain = () => {
    setSelfieFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="flex max-w-533px mx-auto flex-col gap-5 p-5">
      <div className="flex flex-col gap-2 items-center">
        <h2 className="text-2xl font-bold text-center">
          {t("takeSelfieWebcam")}
        </h2>
        <p className="font-medium">{t("positionFaceInOval")}</p>
      </div>

      {previewUrl ? (
        <img
          src={previewUrl}
          alt={t("selfiePreview")}
          className="w-full object-cover rounded-xl"
        />
      ) : (
        <Dropzone
          onDrop={handleDrop}
          multiple={false}
          maxSize={5 * 1024 ** 2}
          accept={IMAGE_MIME_TYPE}
          classNames={{
            root: "border-[0.7px] bg-transparent flex justify-center items-center p-[30px] cursor-pointer rounded-[15px] border-dashed border-[#666666]",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <Image
              src={Mannequin}
              alt="Mannequin"
              className="w-full max-h-48 object-cover opacity-50"
            />
            <p className="text-sm text-white/55 text-center">
              {t("dropSelfieHere")}
            </p>
          </div>
        </Dropzone>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleTakeAgain}
          className="w-full self-center rounded-full py-23px bg-transparent border border-white/55 text-base font-semibold"
        >
          {t("takeAgain")}
        </button>
        <button
          onClick={() => confirmSelfie()}
          disabled={isPending || !selfieFile}
          className="w-full self-center rounded-full py-23px bg-primary text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending && <Loader size="xs" color="white" />}
          {t("confirm")}
        </button>
      </div>
    </div>
  );
};
