import type { AccessSnapshot } from "@/lib/entitlements/access";

type AccessStatePanelProps = {
  snapshot: AccessSnapshot;
};

export function AccessStatePanel({ snapshot }: AccessStatePanelProps) {
  const featureRows = Object.entries(snapshot.features);

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Access State</h3>
      <p className="muted" style={{ marginTop: "0.4rem" }}>
        Plan {snapshot.plan.toUpperCase()} · Role {snapshot.role.toUpperCase()}{" "}
        · Status {snapshot.accessStatus.toUpperCase()}
      </p>
      {snapshot.billingStatus ? (
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          Entitlement mode: {snapshot.billingStatus}
        </p>
      ) : null}
      <p className="muted" style={{ marginTop: "0.4rem" }}>
        Demo mode only. Checkout and subscriptions are intentionally disabled.
      </p>

      <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.45rem" }}>
        {featureRows.map(([feature, enabled]) => (
          <div key={feature} className="feature-row">
            <span>{feature}</span>
            <span className={enabled ? "feature-on" : "feature-off"}>
              {enabled ? "enabled" : "locked"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
