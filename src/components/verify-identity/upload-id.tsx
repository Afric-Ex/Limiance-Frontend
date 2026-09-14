"use client";

import Image from "next/image";
import Logo from "../shared/logo";
import { Divider, Loader } from "@mantine/core";
import Qr from "@/public/limiance-qr.png";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { Dispatch, SetStateAction, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MOCK_MODE } from "@/src/mocks";
import { mockUser } from "@/src/mocks/mock-user";
import { convertFileToBase64 } from "@/src/lib/convert-file-to-base64";
import { successNotification } from "@/src/lib/notification-handler";
import { errorNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

export const UploadId = ({
  setUploaded,
}: {
  setUploaded: Dispatch<SetStateAction<boolean>>;
}) => {
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);

  const { mutate: uploadFront, isPending: frontLoading } = useMutation({
    mutationFn: async (file: File): Promise<any> => {
      const base64 = await convertFileToBase64(file);
      if (!MOCK_MODE.kycUpload) {
        errorNotification("Direct document upload is no longer supported here. Please use the Persona verification flow.");
        throw new Error("Legacy KYC upload flow is disabled");
      }
      return MOCK_MODE.kycUpload
        ? mockUser.uploadKycDocument({ type: "id_front", file: base64 })
        : Promise.reject(new Error("Legacy KYC upload flow is disabled"));
    },
    onSuccess: () => {
      setFrontUploaded(true);
      successNotification("Front ID uploaded");
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const { mutate: uploadBack, isPending: backLoading } = useMutation({
    mutationFn: async (file: File): Promise<any> => {
      const base64 = await convertFileToBase64(file);
      if (!MOCK_MODE.kycUpload) {
        errorNotification("Direct document upload is no longer supported here. Please use the Persona verification flow.");
        throw new Error("Legacy KYC upload flow is disabled");
      }
      return MOCK_MODE.kycUpload
        ? mockUser.uploadKycDocument({ type: "id_back", file: base64 })
        : Promise.reject(new Error("Legacy KYC upload flow is disabled"));
    },
    onSuccess: () => {
      setBackUploaded(true);
      successNotification("Back ID uploaded");
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const canProceed = frontUploaded && backUploaded;

  return (
    <div className="flex max-w-872px mx-auto flex-col gap-8">
      <div className="grid grid-cols-[1.5fr_1fr] gap-10">
        <div className="bg-sectionBorder bg-cover bg-no-repeat p-3 flex flex-col gap-3">
          <div className="flex flex-col gap-6">
            <Logo imageClasses="!w-5 !h-5" textClasses="!text-xs !font-bold" />
            <Image
              src={Qr}
              className="self-center"
              alt="Qr"
              width={212}
              height={167}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center flex-col gap-2">
                <h2 className="font-bold">
                  Scan QR code to continue ID verification on mobile
                </h2>
                <p className="text-sm text-center max-w-446px mx-auto">
                  Ensure that your phone and computer are on the same network or
                  complete the entire process on your mobile browser or app.
                </p>
              </div>
              <Divider
                label="Or"
                classNames={{
                  label:
                    "before:!border-t-white/20 after:!border-t-white/20 !text-white",
                }}
                labelPosition="center"
              />
            </div>
            <p className="text-xs text-white/55 text-center">
              <span className="text-primary underline">Copy the link</span> and
              open in your browser
            </p>
          </div>
        </div>
        <div className="h-full grid grid-rows-2 gap-5">
          <Dropzone
            onDrop={(files) => uploadFront(files[0])}
            loading={frontLoading}
            multiple={false}
            maxSize={5 * 1024 ** 2}
            accept={IMAGE_MIME_TYPE}
            classNames={{
              root: `border-[0.7px] bg-transparent flex justify-center items-center p-[15px] cursor-pointer rounded-[15px] border-dashed ${frontUploaded ? "border-green-500" : "border-[#666666]"}`,
            }}
          >
            <div className="flex items-center flex-col gap-3">
              {frontLoading ? (
                <Loader size="sm" />
              ) : frontUploaded ? (
                <span className="text-green-500 text-2xl">✓</span>
              ) : (
                <svg width="53" height="52" viewBox="0 0 53 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1.18436" y="0.862098" width="50.6328" height="49.8657" rx="24.9328" stroke="#C4C4C4" strokeWidth="0.767164" />
                  <path d="M27.2692 33.8497V29.2467H30.3378L26.502 24.6437L22.6662 29.2467H25.7349V33.8497H21.899V33.8113C21.7701 33.819 21.6474 33.8497 21.5155 33.8497C19.9895 33.8497 18.526 33.2435 17.4469 32.1645C16.3679 31.0854 15.7617 29.622 15.7617 28.096C15.7617 25.1439 17.9942 22.7381 20.8588 22.4082C21.1099 21.0953 21.8107 19.9109 22.8407 19.0588C23.8706 18.2067 25.1653 17.7401 26.502 17.7393C27.8389 17.74 29.1338 18.2065 30.164 19.0586C31.1942 19.9107 31.8953 21.0952 32.1468 22.4082C35.0114 22.7381 37.2408 25.1439 37.2408 28.096C37.2408 29.622 36.6346 31.0854 35.5556 32.1645C34.4765 33.2435 33.013 33.8497 31.487 33.8497C31.3582 33.8497 31.2339 33.819 31.1035 33.8113V33.8497H27.2692Z" fill="#C4C4C4" />
                </svg>
              )}
              <h3 className="text-base font-semibold">
                {frontUploaded ? "Front ID Uploaded" : "Upload Front ID Card"}
              </h3>
              {!frontUploaded && (
                <p className="text-sm text-center text-white/55">
                  Drag a file here or browse for a file to upload
                </p>
              )}
            </div>
          </Dropzone>
          <Dropzone
            onDrop={(files) => uploadBack(files[0])}
            loading={backLoading}
            multiple={false}
            maxSize={5 * 1024 ** 2}
            accept={IMAGE_MIME_TYPE}
            classNames={{
              root: `border-[0.7px] bg-transparent flex justify-center items-center p-[15px] cursor-pointer rounded-[15px] border-dashed ${backUploaded ? "border-green-500" : "border-[#666666]"}`,
            }}
          >
            <div className="flex items-center flex-col gap-3">
              {backLoading ? (
                <Loader size="sm" />
              ) : backUploaded ? (
                <span className="text-green-500 text-2xl">✓</span>
              ) : (
                <svg width="53" height="52" viewBox="0 0 53 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1.18436" y="0.862098" width="50.6328" height="49.8657" rx="24.9328" stroke="#C4C4C4" strokeWidth="0.767164" />
                  <path d="M27.2692 33.8497V29.2467H30.3378L26.502 24.6437L22.6662 29.2467H25.7349V33.8497H21.899V33.8113C21.7701 33.819 21.6474 33.8497 21.5155 33.8497C19.9895 33.8497 18.526 33.2435 17.4469 32.1645C16.3679 31.0854 15.7617 29.622 15.7617 28.096C15.7617 25.1439 17.9942 22.7381 20.8588 22.4082C21.1099 21.0953 21.8107 19.9109 22.8407 19.0588C23.8706 18.2067 25.1653 17.7401 26.502 17.7393C27.8389 17.74 29.1338 18.2065 30.164 19.0586C31.1942 19.9107 31.8953 21.0952 32.1468 22.4082C35.0114 22.7381 37.2408 25.1439 37.2408 28.096C37.2408 29.622 36.6346 31.0854 35.5556 32.1645C34.4765 33.2435 33.013 33.8497 31.487 33.8497C31.3582 33.8497 31.2339 33.819 31.1035 33.8113V33.8497H27.2692Z" fill="#C4C4C4" />
                </svg>
              )}
              <h3 className="text-base font-semibold">
                {backUploaded ? "Back ID Uploaded" : "Upload Back ID Card"}
              </h3>
              {!backUploaded && (
                <p className="text-sm text-center text-white/55">
                  Drag a file here or browse for a file to upload
                </p>
              )}
            </div>
          </Dropzone>
        </div>
      </div>
      <button
        onClick={() => setUploaded(true)}
        disabled={!canProceed}
        className="w-full max-w-514px self-center rounded-full py-23px bg-primary text-base font-semibold disabled:opacity-50"
      >
        Proceed
      </button>
    </div>
  );
};
