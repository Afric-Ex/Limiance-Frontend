"use client";

import { useEffect, useRef, useState } from "react";
import { errorNotification } from "@/src/lib/notification-handler";

declare global {
  interface Window {
    initGeetest4: (
      config: any,
      callback: (captchaObj: any) => void
    ) => void;
  }
}

export interface GeetestResult {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
}

export const useGeetest = () => {
  const [isReady, setIsReady] = useState(false);
  const captchaObjRef = useRef<any>(null);

  useEffect(() => {
    const captchaId = process.env.NEXT_PUBLIC_GEETEST_CAPTCHA_ID;
    
    if (!captchaId) {
      console.warn("Geetest CAPTCHA ID is missing.");
      return;
    }

    const loadGeetest = () => {
      if (window.initGeetest4) {
        initCaptcha();
        return;
      }
      
      const script = document.createElement("script");
      script.src = "https://static.geetest.com/v4/gt4.js";
      script.async = true;
      script.onload = initCaptcha;
      document.head.appendChild(script);
    };

    const initCaptcha = () => {
      window.initGeetest4(
        {
          captchaId,
          product: "bind", // Invisible mode, triggers manually via showCaptcha()
        },
        (captchaObj) => {
          captchaObjRef.current = captchaObj;

          captchaObj.onReady(() => {
            setIsReady(true);
          });

          captchaObj.onError((error: any) => {
            console.error("Geetest error:", error);
            errorNotification("Captcha error. Please try again.");
            captchaObj.reset();
          });
          
          captchaObj.onClose(() => {
            // Fired if user closes the captcha popup
          });
        }
      );
    };

    loadGeetest();

    return () => {
      if (captchaObjRef.current) {
        try {
          captchaObjRef.current.destroy();
        } catch (e) {
          // ignore destroy errors
        }
      }
    };
  }, []);

  const triggerCaptcha = (): Promise<GeetestResult> => {
    return new Promise((resolve, reject) => {
      if (!process.env.NEXT_PUBLIC_GEETEST_CAPTCHA_ID) {
        // Captcha ID not configured — block login and surface the error clearly
        errorNotification("Captcha is not configured. Please contact support.");
        reject(new Error("NEXT_PUBLIC_GEETEST_CAPTCHA_ID is not set"));
        return;
      }

      if (!captchaObjRef.current) {
        errorNotification("Captcha is still loading. Please try again in a moment.");
        reject(new Error("Captcha not initialized yet"));
        return;
      }

      // Clear previous listeners to avoid multiple resolves
      captchaObjRef.current.onSuccess(() => {
        const result = captchaObjRef.current.getValidate();
        if (!result) {
          reject(new Error("Validation failed"));
          return;
        }
        
        captchaObjRef.current.reset(); // Reset for subsequent attempts
        
        resolve({
          lot_number: result.lot_number,
          captcha_output: result.captcha_output,
          pass_token: result.pass_token,
          gen_time: result.gen_time,
        });
      });
      
      captchaObjRef.current.onError(() => {
        reject(new Error("Captcha error"));
      });
      
      captchaObjRef.current.onClose(() => {
        reject(new Error("Captcha closed by user"));
      });

      // Show the captcha
      captchaObjRef.current.showCaptcha();
    });
  };

  const resetCaptcha = () => {
    try {
      captchaObjRef.current?.reset();
    } catch (error) {
      console.warn("Unable to reset captcha", error);
    }
  };

  return { isReady, triggerCaptcha, resetCaptcha };
};
