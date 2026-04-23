import type { ReactNode } from "react";
import { SideNav } from "@/app/components/shell/side-nav";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <main className="shell-layout">
      <SideNav />
      <section className="shell-main">{children}</section>
    </main>
  );
}
