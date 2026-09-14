const list = [
  {
    title: "Rewards Hub",
  },
  {
    title: "SPot",
  },
  {
    title: "Margin",
  },
  {
    title: "Futures",
  },
  {
    title: "Option",
  },
  {
    title: "Trading Bot",
  },
  {
    title: "Earn",
  },
  {
    title: "Funding Wallet",
  },
  {
    title: "Transaction History",
  },
  {
    title: "Verification",
  },
];

export const WalletDropdown = () => {
  return (
    <div className="bg-gray-17/[97%] px-2 py-2 rounded-lg flex flex-col">
      {list.map((item) => (
        <span
          key={item.title}
          className="text-10px hover:bg-gray-9/40 py-3 px-2 text-white/55 rounded cursor-pointer hover:text-primary font-semibold"
        >
          {item.title}
        </span>
      ))}
    </div>
  );
};
