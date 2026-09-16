import { AiBot } from "@/src/components/home/ai-bot";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AiBot />
      {children}
    </>
  );
}