import Image from "next/image";
import FrontId from "@/public/front-id.png";
import BackId from "@/public/back-id.png";
import { Correct } from "../icons/correct";

export const UploadedId = ({ nextStep }: { nextStep: () => void }) => {
  return (
    <div className="flex max-w-1032px mx-auto flex-col gap-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span>Front ID Card</span>
            <span>Back ID Card</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Image
              src={FrontId}
              alt="FrontId"
              className="w-full h-auto object-cover"
            />
            <Image
              src={BackId}
              alt="BackId"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
        <span className="flex self-center items-center flex-col gap-2">
          <span className="text-xs">Good example</span>
          <Correct />
        </span>
      </div>
      <button onClick={nextStep} className="w-full max-w-514px self-center rounded-full py-23px bg-primary text-base font-semibold">
        Proceed to Upload
      </button>
    </div>
  );
};
