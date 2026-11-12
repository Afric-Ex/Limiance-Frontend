"use client";

import { Popover, PopoverTarget, PopoverDropdown, Select, Skeleton } from "@mantine/core";
import React, { useState } from "react";
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import { Secure } from "../icons/secure";
import classes from "../../styles/verify-identity.module.css";
import { useCountryOptions } from "@/src/hooks/use-countries";
import { useTranslations } from "next-intl";

const iDTypes = [
  { labelKey: "driversLicence", isOptional: true },
  { labelKey: "nationalIdCard" },
  { labelKey: "internationalPassport" },
];

export const IdType = ({ nextStep }: { nextStep: () => void }) => {
  const t = useTranslations("Kyc");
  const { options: countries, isLoading, isError } = useCountryOptions();
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
  };

  const selectedCountryData = countries.find(c => c.value === selectedCountry);

  return (
    <div className="flex max-w-524px mx-auto flex-col gap-8">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/65">
              {t("yourCountryRegion")}
            </span>
            <span className="flex text-primary items-center">
              <span className="text-xs font-semibold">{t("edit")}</span>
              <MdKeyboardArrowRight />
            </span>
          </div>
          {isLoading ? (
            <Skeleton height={55} width="100%" />
          ) : isError ? (
            <div className="h-55px flex items-center gap-2 rounded-xl border border-gray-9 py-10px px-5 text-white/50">
              {t("countriesLoadError")}
            </div>
          ) : (
            <Select
              value={selectedCountry}
              onChange={handleCountryChange}
              data={countries}
              searchable
              placeholder={t("selectCountry")}
              classNames={{
                input: "h-55px flex items-center gap-2 rounded-xl border border-gray-9 py-10px px-5 bg-transparent",
                dropdown: "bg-surface border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-xl",
                option: "hover:bg-white/10 data-[combobox-selected]:bg-buy/20 data-[combobox-selected]:text-buy rounded-lg mx-1 my-0.5 transition-colors",
              }}
              rightSection={selectedCountryData?.flagUrl ? (
                <img src={selectedCountryData.flagUrl} alt="" width={24} height={24} className="rounded" />
              ) : null}
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-white/65">{t("idType")}</span>
          <Popover
            classNames={{ dropdown: classes.popover_dropdown }}
            width="target"
          >
            <PopoverTarget>
              <div className="h-55px cursor-pointer flex items-center justify-between rounded-xl border border-gray-9 py-10px px-5">
                <span className="text-sm">{t("nationalPassport")}</span>
                <MdKeyboardArrowDown />
              </div>
            </PopoverTarget>
            <PopoverDropdown>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col pb-4 border-b border-b-white/[16%]">
                  {iDTypes.map((item) => (
                    <div
                      key={item.labelKey}
                      className="p-4 hover:bg-gray-11 cursor-pointer flex items-center justify-between gap-2 text-base font-bold"
                    >
                      <span className="flex items-center gap-10px">
                        {t(item.labelKey)}
                        {item.isOptional && (
                          <span className="px-17px text-primary text-xs font-bold py-5px bg-blue-1/[8%] rounded-lg">
                            {t("optional")}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="py-4 flex justify-center">
                  <span className="flex items-center gap-2 self-center">
                    <Secure opacity={1} color="var(--primary)" />
                    <span className="text-xs">
                      {t("infoUsedForVerificationOnly")}
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
        {t("proceed")}
      </button>
    </div>
  );
};
