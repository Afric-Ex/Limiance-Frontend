const list = [
  {
    title: "Simple earn",
    subtitle: "Effortless earning insights at a glance",
  },
  {
    title: "Staking",
    subtitle: "Fiat-to-crypto and crypto-to-fiat block trades",
  },
  {
    title: "LaunchPad",
    subtitle: "Get ahead with hot and latest tokens",
  },
  {
    title: "Pool Savings",
    subtitle: "Unlimited time to take your trading to the next level",
  },
  {
    title: "Dual Investment",
    subtitle: "Track and manage your earnings effortlessly here",
  },
  {
    title: "Smart Trend",
    subtitle: "Time the market and enjoy incredible yields",
  },
];

export const EarnDropdown = () => {
  return (
    <div className="bg-gray-17/[97%] px-10px py-3 rounded-lg flex flex-col">
      {list.map((item) => (
        <div
          key={item.title}
          className="flex cursor-pointer group py-10px px-2 rounded hover:bg-gray-9/40 flex-col gap-1"
        >
          <span className="text-10px group-hover:text-primary font-semibold">
            {item.title}
          </span>
          <span className="text-8px font-medium text-white/55">
            {item.subtitle}
          </span>
        </div>
      ))}
    </div>
  );
};
