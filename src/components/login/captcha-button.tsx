"use client";

// Must only be imported via next/dynamic({ ssr: false }).
// react-geetest-v4 is not SSR-safe.

import { useEffect, useRef } from "react";
import { useGeeTest, type GeeTestValidateResult } from "react-geetest-v4";

interface CaptchaButtonProps {
  captchaId: string;
  onSuccess: (result?: GeeTestValidateResult) => void;
  onShowCaptcha: (show: () => void) => void;
  onClose?: () => void;
}

export const CaptchaButton = ({
  captchaId,
  onSuccess,
  onShowCaptcha,
  onClose,
}: CaptchaButtonProps) => {
  // useGeeTest initialises the SDK directly — no <GeeTest> component needed.
  // The component form calls JSON.stringify on its DOM children (bind mode),
  // which hits a FiberNode circular reference and crashes.
  const { captcha } = useGeeTest(captchaId, { product: "bind" });

  const onSuccessRef = useRef(onSuccess);
  const onShowCaptchaRef = useRef(onShowCaptcha);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onShowCaptchaRef.current = onShowCaptcha;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!captcha) return;

    // Reset after capturing the result so a retry (e.g. failed login) gets a
    // fresh challenge instead of the already-consumed solve.
    captcha.onSuccess((result) => {
      const resolved = result ?? captcha.getValidate();
      captcha.reset();
      onSuccessRef.current(resolved);
    });
    // Surface abandonment/failure so the form can clear its pending state.
    captcha.onClose(() => onCloseRef.current?.());
    captcha.onError(() => onCloseRef.current?.());
    onShowCaptchaRef.current(() => captcha.showCaptcha());
  }, [captcha]);

  return <div className="hidden" />;
};