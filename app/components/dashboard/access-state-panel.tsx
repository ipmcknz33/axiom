import type { AccessSnapshot } from "@/lib/entitlements/access";
import { UpgradeButton } from "@/app/components/access/upgrade-button";

type AccessStatePanelProps = {
  snapshot: AccessSnapshot;
};

export function AccessStatePanel({ snapshot }: AccessStatePanelProps) {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Access and Upgrade</h3>
      <p className="muted" style={{ marginTop: "0.4rem" }}>
        Plan {snapshot.plan.toUpperCase()} · Role {snapshot.role.toUpperCase()}{" "}
        · Status {snapshot.accessStatus.toUpperCase()}
      </p>
      {snapshot.trialDaysRemaining !== undefined ? (
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          Trial days remaining: {snapshot.trialDaysRemaining}
        </p>
      ) : null}
      {snapshot.trialExpired ? (
        <p style={{ color: "#fca5a5", marginTop: "0.4rem" }}>
          Trial expired. Some premium features are locked.
        </p>
      ) : null}
      <p className="muted" style={{ marginTop: "0.4rem" }}>
        Stripe ready: {snapshot.stripeReady ? "yes" : "no"}
      </p>

      <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.45rem" }}>
        {Object.entries(snapshot.features).map(([feature, enabled]) => (
          <div key={feature} className="feature-row">
            <span>{feature}</span>
            <span className={enabled ? "feature-on" : "feature-off"}>
              {enabled ? "enabled" : "locked"}
            </span>
          </div>
        ))}
      </div>

      {snapshot.canUpgrade ? (
        <div style={{ marginTop: "0.9rem" }}>
          <div className="upgrade-grid">
            <UpgradeButton plan="premium" text="Upgrade to Premium" />
            <UpgradeButton plan="pro" text="Upgrade to Pro" />
            <UpgradeButton plan="business" text="Upgrade to Business" />
          </div>
          {!snapshot.stripeReady ? (
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              Billing setup pending. Configure Stripe env values to enable
              checkout.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
