import { Button, LoadingOverlay, Slider } from "@mantine/core";
import React, { useState } from "react";
import { images } from "../assets/images";
import {
  successNotification,
  errorNotification,
} from "@/src/lib/notification-handler";
import axios from "axios";
import { useGoogleReCaptcha } from "react19-google-recaptcha-v3";
import Image from "next/image";
import { modals } from "@mantine/modals";
import { useAuth } from "@/src/hooks/queries/use-auth";

export const ReCaptcha = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [value, setValue] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const { handleForgotPassword, forgotLoading } = useAuth();

  const handleDragEnd = async () => {
    if (!executeRecaptcha) {
      console.log("not available to execute recaptcha");
      return;
    }
    setLoading(true);
    const gRecaptchaToken = await executeRecaptcha("dragTest");

    const response = await axios({
      method: "post",
      url: "/api/verify-captcha",
      data: {
        gRecaptchaToken,
      },
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
    });

    if (response?.data?.success === true) {
      setScore(response?.data?.score);
      successNotification("ReCaptcha Verified and Form Submitted!");
    } else {
      setScore(response?.data?.score);
      errorNotification("Failed to verify recaptcha! You must be a robot!");
    }
    setLoading(false);
  };

  console.log(score);

  return (
    <>
      <div className="flex w-full flex-col items-center gap-6">
        <h2 className="text-3xl font-bold">Solve reCAPTCHA</h2>
        <div className="flex w-full flex-col gap-4">
          <span className="">Solve to proceed</span>
          <div className="h-[342px] w-full relative">
            <Image
              src={images.recaptcha}
              alt="recaptcha"
              className="w-full h-full rounded-2xl object-cover"
            />
            <div className="px-[9px] rounded-3xl absolute bottom-4 inset-x-4 py-[21px] bg-gray-41">
              <Slider
                value={value}
                onChange={setValue}
                onChangeEnd={handleDragEnd}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="h-3 bg-gray-42 w-full rounded-3xl">
              <div
                style={{ width: `${score * 100}%` }}
                className="h-full rounded-3xl bg-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="py-6px rounded px-11px bg-gray-43/[18%] text-gray-14">
                Poor
              </span>
              <span className="py-6px rounded px-11px bg-gray-43/[18%] text-gray-14">
                Excellent
              </span>
            </div>
          </div>
          <LoadingOverlay visible={loading} />
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-4">
        <Button
          onClick={modals.closeAll}
          className="!h-55px !grayscale !rounded-25px !bg-primary"
        >
          Cancel
        </Button>
        <Button
          disabled={score < 0.5}
          className="!h-55px disabled:!bg-gray-9 disabled:!text-white !rounded-25px !bg-primary"
          onClick={handleForgotPassword}
          loading={forgotLoading}
        >
          Proceed
        </Button>
      </div>
    </>
  );
};
