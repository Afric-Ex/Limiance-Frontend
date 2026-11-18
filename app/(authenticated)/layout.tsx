import { ReactNode } from "react";
import { UserInitializer } from "@/src/components/shared/user-initializer";
import { PortfolioRealtimeSync } from "@/src/components/shared/portfolio-realtime-sync";

export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <UserInitializer />
      <PortfolioRealtimeSync />
      {children}
    </>
  );
}
