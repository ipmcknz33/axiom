import type { ReactNode } from "react";
import { SideNav } from "@/app/components/shell/side-nav";

type DashboardShellProps = {
  billingSignal?: string;
  children: ReactNode;
};

export function DashboardShell({
  billingSignal,
  children,
}: DashboardShellProps) {
  return (
    <main className="shell-layout">
      <SideNav />
      <section className="shell-main">
        {billingSignal === "success" ? (
          <div className="status-banner status-success">
            Billing updated successfully. Your entitlement state will sync
            shortly.
          </div>
        ) : null}
        {billingSignal === "canceled" ? (
          <div className="status-banner status-canceled">
            Checkout canceled. You can resume upgrade anytime from the billing
            panel.
          </div>
        ) : null}
        {children}
      </section>
    </main>
  );
}
