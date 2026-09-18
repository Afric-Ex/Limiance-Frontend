import VerifySuccess from "@/public/verify-success.png";
import { Button } from "@mantine/core";
import { modals } from "@mantine/modals";
import Image, { StaticImageData } from "next/image";
import { ReactNode } from "react";
import { MdOutlineClose } from "react-icons/md";

export const SuccessModal = ({
  title,
  description,
  onProceed,
  buttonText,
  onClose,
  icon = VerifySuccess
}: {
  title: string;
  description: ReactNode;
  onProceed: () => void;
  onClose?: () => void;
  buttonText?: string;
  icon?: StaticImageData
}) => {
  return (
    <div className="w-full max-w-[540px] bg-[#181a20] rounded-2xl flex flex-col items-center p-8 gap-8 border border-white/[0.06] relative animate-fade-in-up">
      <div className="w-full flex justify-end absolute top-4 right-4 -mr-0">
        <button
          onClick={() => {
            modals.closeAll();
            onClose?.();
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
        >
          <MdOutlineClose size={16} />
        </button>
      </div>

      <div className="flex items-center justify-center w-[124px] h-[124px] rounded-full mt-4 -mb-2 border-4 border-success-6/10 relative">
        <div className="absolute inset-0 bg-success-6/20 rounded-full animate-pulse" />
        <Image
          src={icon}
          width={124}
          height={124}
          alt="verify success image"
          className="relative z-10 drop-shadow-[0_0_24px_rgba(37,171,66,0.4)]"
        />
      </div>

      <div className="flex items-center flex-col gap-8 w-full px-2">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-[32px] tracking-tight font-bold text-white">{title}</h2>
          <div className="text-center text-white/50 text-base max-w-[380px] font-medium leading-relaxed">{description}</div>
        </div>
        <Button
          onClick={onProceed}
          className="!h-[55px] !rounded-xl !bg-primary hover:!bg-primary/90 hover:!shadow-[0_0_16px_rgba(77,119,240,0.3)] !text-white !font-bold !transition-all active:!scale-[0.98] w-full"
          fullWidth
        >
          {buttonText ?? "Proceed"}
        </Button>
      </div>
    </div>
  );
};
