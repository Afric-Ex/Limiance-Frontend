import { Tabs, TabsList, TabsPanel, TabsTab, TextInput } from "@mantine/core";
import clsx from "clsx";
import React from "react";
import { Search } from "../icons/search";

const languages = [
  "English",
  "Español",
  "英国人的",
  "Hungarian",
  "Português (Brasil)",
  "Filipino",
  "Slovenčina",
  "Italiano",
  "Polski",
  "Português",
  "Čeština",
  "Deutsch",
];

const currencies = [
  "USD - $",
  "SAR - SAR",
  "PHP - ₱",
  "BGN-лв",
  "COP - COL$",
  "EGP - EGP",
  "TRY - ₺",
  "AUD - A$",
  "IDR - Rp",
  "Cedis",
  "MXN - Mex$",
  "NGR - #",
];

export const LanguageDropdown = ({ isMobile }: { isMobile?: boolean }) => {
  const defaultLanguage = "English";
  const defaultCurrency = "USD - $";
  return (
    <div
      className={clsx(!isMobile && "w-[354px] rounded-lg", "bg-gray-17 p-5")}
    >
      <Tabs
        defaultValue="language"
        classNames={{
          root: "!flex !flex-col gap-4",
          tabLabel: "!text-10px !font-semibold",
        }}
      >
        <TabsList>
          <TabsTab value="language">Language</TabsTab>
          <TabsTab value="currency">Currency</TabsTab>
        </TabsList>
        <TabsPanel value="language">
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-2 bg-black/[8%] py-6px px-3 rounded-lg border border-gray-9/40">
              <svg
                width="10"
                height="11"
                viewBox="0 0 10 11"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 8.21429C5.17708 8.21429 5.32562 8.15943 5.44562 8.04971C5.56562 7.94 5.62542 7.80438 5.625 7.64286V5.92857C5.625 5.76667 5.565 5.63105 5.445 5.52171C5.325 5.41238 5.17667 5.35752 5 5.35714C4.82333 5.35676 4.675 5.41162 4.555 5.52171C4.435 5.63181 4.375 5.76743 4.375 5.92857V7.64286C4.375 7.80476 4.435 7.94057 4.555 8.05028C4.675 8.16 4.82333 8.21467 5 8.21429ZM5 4.21429C5.17708 4.21429 5.32562 4.15943 5.44562 4.04971C5.56562 3.94 5.62542 3.80438 5.625 3.64286C5.62458 3.48133 5.56458 3.34571 5.445 3.236C5.32542 3.12629 5.17708 3.07143 5 3.07143C4.82292 3.07143 4.67458 3.12629 4.555 3.236C4.43542 3.34571 4.37542 3.48133 4.375 3.64286C4.37458 3.80438 4.43458 3.94019 4.555 4.05029C4.67542 4.16038 4.82375 4.21505 5 4.21429ZM1.25 10.5C0.90625 10.5 0.612083 10.3882 0.3675 10.1646C0.122917 9.94095 0.000416667 9.67181 0 9.35714V4.21429C0 4.03333 0.0443749 3.8619 0.133125 3.7C0.221875 3.5381 0.344167 3.40476 0.5 3.3L4.25 0.728571C4.46875 0.576191 4.71875 0.5 5 0.5C5.28125 0.5 5.53125 0.576191 5.75 0.728571L9.5 3.3C9.65625 3.40476 9.77875 3.5381 9.8675 3.7C9.95625 3.8619 10.0004 4.03333 10 4.21429V9.35714C10 9.67143 9.8775 9.94057 9.6325 10.1646C9.3875 10.3886 9.09333 10.5004 8.75 10.5H1.25Z"
                  fill="white"
                />
              </svg>
              <span className="text-8px max-w-[257px] text-white/55">
                Your chosen langauage will be apply to your Afriq email,SMS,
                in-app notifications, and all devices you&apos;re logged into.
              </span>
            </span>
            <div className="grid grid-cols-3 gap-y-5 gap-2">
              {languages.map((item) => (
                <span
                  className={clsx(
                    defaultLanguage === item
                      ? "font-semibold text-primary"
                      : "text-gray-9 hover:text-white cursor-pointer",
                    "text-10px"
                  )}
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </TabsPanel>
        <TabsPanel value="currency">
          <div className="flex flex-col gap-4">
            <TextInput
              leftSection={<Search />}
              placeholder="Search"
              classNames={{
                input:
                  "!h-[35px] !border-gray-9/40 !rounded-3xl !bg-transparent focus:!border-primary",
              }}
            />
            <div className="grid grid-cols-3 gap-y-5 gap-2">
              {currencies.map((item) => (
                <span
                  className={clsx(
                    defaultCurrency === item
                      ? "font-semibold text-primary"
                      : "text-gray-9 hover:text-white cursor-pointer",
                    "text-10px"
                  )}
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </TabsPanel>
      </Tabs>
    </div>
  );
};
