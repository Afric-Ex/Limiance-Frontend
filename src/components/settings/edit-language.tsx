"use client";

import { Radio, RadioGroup } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useLocale, useTranslations } from "next-intl";
import { ModalClose } from "../icons/modal-close";
import { useLocaleSwitcher } from "@/src/hooks/use-locale-switcher";
import { locales, localeNames, isLocale } from "@/i18n/routing";

export const EditLanguage = ({ initialLanguage }: { initialLanguage?: string }) => {
  const tc = useTranslations("Common");
  const locale = useLocale();
  const { switchLocale } = useLocaleSwitcher();
  const selected = isLocale(initialLanguage) ? initialLanguage : locale;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-bold">{tc("language")}</h4>
        <ModalClose onClick={() => modals.closeAll()} />
      </div>
      <div className="flex flex-col gap-16">
        <RadioGroup value={selected} onChange={(value) => value && switchLocale(value)}>
          <div className="flex flex-col gap-6">
            {locales.map((item) => (
              <Radio
                key={item}
                labelPosition="right"
                label={localeNames[item]}
                value={item}
              />
            ))}
          </div>
        </RadioGroup>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => modals.closeAll()}
            className="bg-gray-9 rounded-xl py-18px text-base font-medium"
          >
            {tc("cancel")}
          </button>
          <button
            onClick={() => modals.closeAll()}
            className="bg-primary rounded-xl py-18px text-base font-medium"
          >
            {tc("done")}
          </button>
        </div>
      </div>
    </div>
  );
};
