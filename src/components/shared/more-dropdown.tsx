const list = [
  {
    title: "Vip & Institution",
    subtitle: "Your reliable digital asset platform tailored for VIPs and institutions.",
    rightSection: (
      <span className="py-[1px] font-medium text-6px px-6px bg-primary rounded-sm">
        NEW
      </span>
    ),
  },
  {
    title: "Launchpool",
    subtitle: "Lock to uncover promising new tokens",
  },
  {
    title: "Pay",
    subtitle: "Send, receive and spend crypto",
  },
  {
    title: "Loans",
    subtitle: "Obtain an instant loan backed by your crypto assets.",
  },
  {
    title: "NFT",
    subtitle: "Discover NFTs crafted by creators from around the globe.",
  },
  {
    title: "Web3Wallet",
    subtitle: "Experience the Web3 wallet of the next generation.",
  },
];

export const MoreDropdown = () => {
  return (
    <div className="bg-gray-17/[97%] px-10px py-3 rounded-lg flex flex-col">
      {list.map((item) => (
        <div
          key={item.title}
          className="flex cursor-pointer group py-10px px-2 rounded hover:bg-gray-9/40 flex-col gap-1"
        >
          <span className="text-10px flex items-center gap-2 font-semibold">
            <span className="group-hover:text-primary">{item.title}</span>
            {item.rightSection}
          </span>
          <span className="text-8px font-medium text-white/55">
            {item.subtitle}
          </span>
        </div>
      ))}
    </div>
  );
};
