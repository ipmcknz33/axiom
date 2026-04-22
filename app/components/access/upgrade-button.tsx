"use client";

import { useState } from "react";

type UpgradeButtonProps = {
  plan: "premium" | "pro" | "business";
  text?: string;
};

export function UpgradeButton({ plan, text }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpgradeClick() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/billing/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const payload = (await response.json()) as {
        data?: { checkoutUrl?: string };
        error?: { message?: string };
      };

      if (!response.ok || !payload.data?.checkoutUrl) {
        throw new Error(payload.error?.message ?? "Unable to start checkout.");
      }

      window.location.assign(payload.data.checkoutUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start checkout.",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="upgrade-btn"
        onClick={onUpgradeClick}
        disabled={loading}
      >
        {loading ? "Redirecting..." : (text ?? `Upgrade to ${plan}`)}
      </button>
      {error ? <p className="upgrade-error">{error}</p> : null}
    </div>
  );
}
