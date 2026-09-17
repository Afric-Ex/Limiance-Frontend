import { Star } from "@/src/components/icons/star";
import { Circle } from "@/src/components/icons/circle";
import { DoubleCircle } from "@/src/components/icons/double-circle";

export const HeroDecorations = () => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <Star className="absolute left-[10%] top-[10%] animate-spin" />
      <DoubleCircle className="absolute animate-spin right-[10%] top-[7%]" />
      <Circle color="var(--primary)" className="absolute animate-bounce left-[15%] top-[30%]" />
      <Circle className="absolute right-[8%] bottom-[50%] animate-bounce" />
      <Circle className="absolute w-6 h-6 left-[15%] bottom-[30%] animate-bounce" />
      <Star className="absolute w-10 right-[10%] animate-spin bottom-[10%]" />
    </div>
  );
};