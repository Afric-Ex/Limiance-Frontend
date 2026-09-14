"use client";

import { TextInput, Button } from "@mantine/core";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { modals } from "@mantine/modals";
import { ResetModal } from "./reset-modal";
import { useAuthStore } from "@/src/stores/auth-store";

const inputStyles = {
  input:
    "!bg-transparent !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[55px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20",
  label: "!text-sm !font-semibold !text-white/70 !mb-1.5",
};

export const ForgotPasswordForm = () => {
  const setEmail = useAuthStore((state) => state.setEmail);
  const email = useAuthStore((state) => state.email);
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div className="flex flex-col gap-8">
        <TextInput
          classNames={inputStyles}
          label="Email / Number"
          type="email"
          placeholder="Enter email or phone"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          onClick={() =>
            modals.open({
              children: <ResetModal />,
              ...DEFAULT_MODAL_SETTINGS,
              closeOnClickOutside: false,
            })
          }
          className="!h-[55px] !rounded-xl !bg-primary hover:!bg-primary/90 hover:!shadow-[0_0_16px_rgba(77,119,240,0.3)] !text-white !font-bold !transition-all active:!scale-[0.98]"
          fullWidth
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
