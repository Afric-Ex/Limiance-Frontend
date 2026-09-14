import { Popover, PopoverTarget, PopoverDropdown } from "@mantine/core";
import React from "react";
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import { Secure } from "../icons/secure";
import classes from "../../styles/verify-identity.module.css";
import Image from "next/image";
import Uk from "@/public/united kingdom.png";

const iDTypes = [
  { name: "Driver's License", isOptional: true },
  { name: "National ID Card" },
  { name: "International Passport" },
];

export const IdType = ({ nextStep }: { nextStep: () => void }) => {
  return (
    <div className="flex max-w-524px mx-auto flex-col gap-8">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/65">
              Your Country/region
            </span>
            <span className="flex text-primary items-center">
              <span className="text-xs font-semibold">Edit</span>
              <MdKeyboardArrowRight />
            </span>
          </div>
          <div className="h-55px flex items-center gap-2 rounded-xl border border-gray-9 py-10px px-5">
            <Image src={Uk} alt="Uk" width={35} height={35} />
            <span className="text-sm">United Kingdom</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-white/65">ID type</span>
          <Popover
            classNames={{ dropdown: classes.popover_dropdown }}
            width="target"
          >
            <PopoverTarget>
              <div className="h-55px cursor-pointer flex items-center justify-between rounded-xl border border-gray-9 py-10px px-5">
                <span className="text-sm">National Passport</span>
                <MdKeyboardArrowDown />
              </div>
            </PopoverTarget>
            <PopoverDropdown>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col pb-4 border-b border-b-white/[16%]">
                  {iDTypes.map((item) => (
                    <div
                      key={item.name}
                      className="p-4 hover:bg-gray-11 cursor-pointer flex items-center justify-between gap-2 text-base font-bold"
                    >
                      <span className="flex items-center gap-10px">
                        {item.name}
                        {item.isOptional && (
                          <span className="px-17px text-primary text-xs font-bold py-5px bg-blue-1/[8%] rounded-lg">
                            optional
                          </span>
                        )}
                      </span>
                      {/* <svg
                                  width="24"
                                  height="25"
                                  viewBox="0 0 24 25"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M6 12.5L10.2426 16.7426L18.727 8.25732"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg> */}
                    </div>
                  ))}
                </div>
                <div className="py-4 flex justify-center">
                  <span className="flex items-center gap-2 self-center">
                    <Secure opacity={1} color="var(--primary)" />
                    <span className="text-xs">
                      Your information is only used for identity verification.
                    </span>
                  </span>
                </div>
              </div>
            </PopoverDropdown>
          </Popover>
        </div>
      </div>
      <button
        onClick={nextStep}
        className="w-full rounded-full py-23px bg-primary text-base font-semibold"
      >
        Proceed
      </button>
    </div>
  );
};
