import Link from "next/link";
import React from "react";

const footerLinks = [
  {
    group: "About Us",
    list: {
      children: [
        {
          name: "About",
          link: "",
        },
        {
          name: "Careers",
          link: "",
        },
        {
          name: "Announcements",
          link: "",
        },
        {
          name: "News",
          link: "",
        },
        {
          name: "Press",
          link: "",
        },
        {
          name: "Terms of Service",
          link: "",
        },
        {
          name: "Privacy Notice",
          link: "",
        },
        {
          name: "AfriqX app",
          link: "",
        },
        {
          name: "Blog",
          link: "",
        },
        {
          name: "Risk Warning",
          link: "",
        },
      ],
    },
  },
  {
    group: "Service",
    list: {
      children: [
        {
          name: "Affiliate",
          link: "",
        },
        {
          name: "Refferrals",
          link: "",
        },
        {
          name: "Historical Market Data",
          link: "",
        },
        {
          name: "Proof of Reserves",
          link: "",
        },
        {
          name: "listing application",
          link: "",
        },
        {
          name: "OTC Trading",
          link: "",
        },
        {
          name: "Audit",
          link: "",
        },
      ],
      subList: {
        name: "Learn",
        children: [
          {
            name: "Buy Crypto",
            link: "",
          },
          {
            name: "Bitcoin Price",
            link: "",
          },
          {
            name: "Buy BNB",
            link: "",
          },
          {
            name: "Buy Bitcoin",
            link: "",
          },
          {
            name: "Buy Ethereum",
            link: "",
          },
          {
            name: "Buy Solana",
            link: "",
          },
        ],
      },
    },
  },
  {
    group: "Product",
    list: {
      children: [
        {
          name: "Exchange",
          link: "",
        },
        {
          name: "Buy Crypto",
          link: "",
        },
        {
          name: "Convert",
          link: "",
        },
        {
          name: "NFT",
          link: "",
        },
        {
          name: "Launchpool",
          link: "",
        },
        {
          name: "All cryptocurrencies",
          link: "",
        },
        {
          name: "Trading View",
          link: "",
        },
      ],
      subList: {
        name: "Crypto Calculator",
        children: [
          {
            name: "BTC to USD",
            link: "",
          },
          {
            name: "ETH to USD",
            link: "",
          },
          {
            name: "SOL to USD",
            link: "",
          },
          {
            name: "USDT to USD",
            link: "",
          },
        ],
      },
    },
  },
  {
    group: "Support",
    list: {
      children: [
        {
          name: "Support Center",
          link: "/support",
        },
        {
          name: "24/7 Chat Support",
          link: "",
        },
        {
          name: "Connect With AfriqX",
          link: "",
        },
        {
          name: "User Feedback",
          link: "",
        },
        {
          name: "Trading Fee",
          link: "",
        },
        {
          name: "API",
          link: "",
        },
        {
          name: "Authencity Check",
          link: "",
        },
      ],
    },
  },
];

export const FooterLinks = () => {
  return footerLinks.map((item) => (
    <div key={item.group} className="flex flex-col gap-18px">
      <h3 className="md:text-19px text-sm font-bold">{item.group}</h3>
      <div className="flex flex-col gap-11px">
        {item.list.children.map((el, index) => (
          <Link key={index} href={el.link} className="md:text-19px text-sm">
            {el.name}
          </Link>
        ))}
        {item.list.subList ? (
          <div className="flex flex-col gap-2">
            <h3 className="md:text-19px text-sm font-bold">{item.list.subList.name}</h3>
            <div className="flex flex-col gap-11px">
              {item.list.subList?.children?.map((ele, idx) => (
                <Link key={idx} href={ele.link} className="md:text-19px text-sm">
                  {ele.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  ));
};
