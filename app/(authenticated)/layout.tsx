import { ReactNode } from "react";
import { UserInitializer } from "@/src/components/shared/user-initializer";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <UserInitializer />
      {children}
    </>
  );
}
