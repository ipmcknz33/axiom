"use client";

import { useEffect, useMemo, useState } from "react";

type BillingState =
  | "active"
  | "trial"
  | "processing"
  | "past_due"
  | "canceled"
  | "expired";

type BillingSnapshot = {
  billingState: BillingState;
  currentPeriodEnd?: string;
  plan: "premium" | "pro" | "business" | "free";
};

type BillingPanelProps = {
  billingSignal?: string;
};

const DEMO_USER_ID = "11111111-1111-4111-8111-111111111111";

export function BillingPanel({ billingSignal }: BillingPanelProps) {
  const [selectedPlan, setSelectedPlan] = useState<
    "premium" | "pro" | "business"
  >("pro");
  const [demoUserId, setDemoUserId] = useState(DEMO_USER_ID);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);

  const banner = useMemo(() => {
    if (billingSignal === "success")
      return "Checkout completed. Syncing billing status...";
    if (billingSignal === "canceled")
      return "Checkout canceled. You can retry anytime.";
    return null;
  }, [billingSignal]);

  async function refreshSnapshot() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/billing/snapshot", {
        method: "GET",
        headers: {
          "x-axiom-user-id": demoUserId,
        },
      });

      const payload = (await response.json()) as {
        data?: { snapshot?: BillingSnapshot };
        error?: { message?: string };
      };

      if (!response.ok || !payload.data?.snapshot) {
        throw new Error(
          payload.error?.message ?? "Unable to load billing snapshot.",
        );
      }

      setSnapshot(payload.data.snapshot);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load billing snapshot.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function startCheckout() {
    if (loadingCheckout) return;
    setLoadingCheckout(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/billing/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-axiom-user-id": demoUserId,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const payload = (await response.json()) as {
        data?: { checkoutUrl?: string };
        error?: { message?: string };
      };

      if (!response.ok || !payload.data?.checkoutUrl) {
        throw new Error(
          payload.error?.message ?? "Unable to start Stripe checkout.",
        );
      }

      window.location.assign(payload.data.checkoutUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start Stripe checkout.",
      );
      setLoadingCheckout(false);
    }
  }

  useEffect(() => {
    refreshSnapshot();
  }, []);

  useEffect(() => {
    if (billingSignal === "success") {
      const handle = setTimeout(() => {
        refreshSnapshot();
      }, 1200);

      return () => clearTimeout(handle);
    }

    return;
  }, [billingSignal]);

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Billing</h3>
      {banner ? <p className="status-inline">{banner}</p> : null}

      <label
        className="muted"
        style={{ display: "block", marginBottom: "0.35rem" }}
      >
        Demo user UUID
      </label>
      <input
        value={demoUserId}
        onChange={(event) => setDemoUserId(event.target.value)}
        className="billing-input"
      />

      <p
        className="muted"
        style={{ marginTop: "0.85rem", marginBottom: "0.45rem" }}
      >
        Selected plan
      </p>
      <select
        value={selectedPlan}
        onChange={(event) =>
          setSelectedPlan(event.target.value as "premium" | "pro" | "business")
        }
        className="billing-input"
      >
        <option value="premium">premium</option>
        <option value="pro">pro</option>
        <option value="business">business</option>
      </select>

      <div
        style={{
          marginTop: "0.85rem",
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        <button
          className="upgrade-btn"
          type="button"
          disabled={loadingCheckout}
          onClick={startCheckout}
        >
          {loadingCheckout ? "Redirecting..." : "Upgrade"}
        </button>
        <button
          className="upgrade-btn"
          type="button"
          disabled={refreshing}
          onClick={refreshSnapshot}
        >
          {refreshing ? "Refreshing..." : "Refresh status"}
        </button>
      </div>

      <div style={{ marginTop: "0.8rem" }}>
        <p className="muted" style={{ margin: 0 }}>
          Plan: {snapshot?.plan ?? "unknown"} · State:{" "}
          {snapshot?.billingState ?? "unknown"}
        </p>
        {snapshot?.currentPeriodEnd ? (
          <p className="muted" style={{ margin: "0.4rem 0 0" }}>
            Current period end:{" "}
            {new Date(snapshot.currentPeriodEnd).toLocaleString()}
          </p>
        ) : null}
      </div>

      {error ? <p className="upgrade-error">{error}</p> : null}
    </div>
  );
}
