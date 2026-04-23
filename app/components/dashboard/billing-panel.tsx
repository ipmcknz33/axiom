"use client";

import { useMemo } from "react";

type BillingPanelProps = {
  billingSignal?: string;
};

export function BillingPanel({ billingSignal }: BillingPanelProps) {
  const banner = useMemo(() => {
    if (billingSignal === "success")
      return "Demo mode: return query detected, but checkout is disabled.";
    if (billingSignal === "canceled") return "Demo mode: no active checkout.";
    return null;
  }, [billingSignal]);

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Billing (Disabled)</h3>
      {banner ? <p className="status-inline">{banner}</p> : null}
      <p className="muted" style={{ marginTop: "0.5rem" }}>
        This workspace runs in non-SaaS demo mode. Checkout, subscription
        syncing, and webhook billing flows are not active.
      </p>
    </div>
  );
}
