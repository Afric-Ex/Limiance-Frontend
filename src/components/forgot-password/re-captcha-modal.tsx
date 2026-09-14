import { modals } from "@mantine/modals";
import Image from "next/image";
import { IoCloseCircleOutline } from "react-icons/io5";
import { images } from "../assets/images";
import { ReCaptcha } from "./re-captcha";

export const ReCaptchaModal = () => {
  return (
    <div className="w-[582px] px-10 py-6 bg-gray-10 border border-gray-11 relative items-center flex flex-col gap-50px rounded-32px">
      <IoCloseCircleOutline
        className="absolute right-3 top-6 text-gray-11 cursor-pointer"
        size={38}
        onClick={modals.closeAll}
      />
      <Image src={images.warning} width={80} height={80} alt="warning" />
      <div className="flex w-full items-center flex-col gap-16">
        <ReCaptcha />
      </div>
    </div>
  );
};
