import Logo from "./logo";

export function AuthMobileBrand({ className = "" }: { className?: string }) {
  return (
    <div className={`min-[1150px]:hidden flex w-full items-center justify-center mb-8 ${className}`}>
      <Logo imageClasses="w-[170px] max-w-full h-auto" />
    </div>
  );
}
