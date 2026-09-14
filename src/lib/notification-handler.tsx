import toast from "react-hot-toast";
import { MdCheckCircle, MdErrorOutline } from "react-icons/md";
import React from "react";

const toastDarkModeStyles = {
  style: {
    background: "rgba(24, 26, 32, 0.8)",
    color: "#fff",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "16px 20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    fontSize: "14px",
    fontWeight: 500,
  },
  duration: 4000,
  position: "top-center" as const,
};

export const successNotification = (message: string) =>
  toast.success(message, {
    ...toastDarkModeStyles,
    icon: <MdCheckCircle size={22} className="text-primary" />,
  });

export const errorNotification = (message: string) =>
  toast.error(message, {
    ...toastDarkModeStyles,
    icon: <MdErrorOutline size={22} className="text-red-500" />,
  });
