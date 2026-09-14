"use client";

import React from "react";
import Logo from "./logo";
import { GoogleWhite } from "../icons/google-white";
import { TikTok } from "../icons/tik-tok";
import { Mastercard } from "../icons/mastercard";
import { Facebook } from "../icons/facebook";
import { Messenger } from "../icons/messenger";
import { Twitter } from "../icons/twitter";
import { Youtube } from "../icons/youtube";
import { Telegram } from "../icons/telegram";
import { Linkedin } from "../icons/linkedin";
import { Apple } from "../icons/apple";
import { IoIosArrowDown } from "react-icons/io";
import { FaGlobe } from "react-icons/fa";
import { Dollar } from "../icons/dollar";
import Image from "next/image";
import QrScan from "@/public/qr-scan.png";
import { usePathname } from "next/navigation";
import { FooterLinks } from "./footer-links";

const noFooterPages = ["/dashboard", "/settings"];
const noFooterInnerPages = [
  "assets",
  "trades",
  "transactions",
  "orders",
  "account",
  "buy-crypto",
];

export const Footer = () => {
  const pathname = usePathname();

  return pathname.includes("auth") ||
    noFooterPages.includes(pathname) ||
    noFooterInnerPages.some((each) => pathname.includes(each)) ? null : (
    <div className="flex flex-col gap-30px">
      <div className="min-[1130px]:flex grid grid-cols-2 max-w-1206px mx-auto px-4 w-full gap-4 justify-between">
        <div className="flex-1 flex gap-6">
          <div className="flex w-fit flex-col gap-10">
            <Logo />
            <div className="flex flex-col gap-30px">
              <h3 className="font-bold text-19px">Community</h3>
              <div className="grid grid-cols-4 gap-4 [&>svg]:cursor-pointer [&>svg]:transition-all hover:[&>svg]:scale-110 hover:[&>svg]:opacity-80">
                <GoogleWhite />
                <TikTok />
                <Mastercard />
                <Facebook />
                <Messenger />
                <Twitter />
                <Youtube />
                <Telegram />
                <Linkedin />
                <Apple />
              </div>
              <div className="flex flex-col gap-3">
                <button className="p-4 bg-white text-black rounded-lg gap-6 flex items-center">
                  <FaGlobe size={20} />
                  <span className="text-15px">English</span>
                  <IoIosArrowDown size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <Dollar />
                  <span className="text-15px">USD-$</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 max-[1130px]:hidden grid grid-cols-4 gap-2">
            <FooterLinks />
          </div>
        </div>
        <div className="flex max-[1130px]:justify-self-center flex-col gap-18px">
          <h3 className="text-19px font-bold">Start Trading Now</h3>
          <div className="flex flex-col gap-6px">
            <div className="flex flex-col">
              <div className="pt-5 px-5 pb-6px w-fit rounded-t-15px border-t border-t-primary border-x border-x-primary">
                <Image src={QrScan} width={118} height={113} alt="qr" />
              </div>
              <span className="text-white/55 self-center text-11px">
                Scan to download the app
              </span>
            </div>
            <button className="bg-primary h-9 w-169px rounded-full text-11px">
              Register
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-[1130px]:hidden px-4 max-sm:gap-y-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <FooterLinks />
      </div>
      <div className="border-t border-t-white/25 py-5">
        <div className="max-w-543px mx-auto w-full flex sm:flex-row flex-col items-center justify-between gap-3">
          <span className="text-11px text-white/55">
            &copy; {new Date().getFullYear()} Limiance.com. All rights reserved.
          </span>
          <span className="text-11px text-white/55 hover:text-white transition-colors cursor-pointer">Terms of Service | Privacy Terms</span>
        </div>
      </div>
    </div>
  );
};
