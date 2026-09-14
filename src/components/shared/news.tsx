import { IoMegaphoneOutline } from "react-icons/io5";

export const News = () => {
  return (
    <div className="flex items-center gap-3 whitespace-nowrap px-4 border-r border-white/[0.06] last:border-r-0">
      <div className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0">
        <IoMegaphoneOutline size={14} />
      </div>
      <span className="text-sm text-white/70 font-medium">
        <span className="font-bold text-white mr-1.5">Exciting News:</span> 
        $LUMI is Now Live on Limiance! Start trading with zero fees today.
      </span>
    </div>
  );
};
