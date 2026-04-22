import { UpgradeButton } from "@/app/components/access/upgrade-button";

type FeatureLockProps = {
  ctaHref?: string;
  ctaLabel?: string;
  description: string;
  recommendedPlan?: "premium" | "pro" | "business";
  title: string;
};

export function FeatureLock({
  ctaHref = "/app?upgrade=1",
  ctaLabel = "Upgrade to unlock",
  description,
  recommendedPlan = "premium",
  title,
}: FeatureLockProps) {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="muted">{description}</p>
      <div style={{ display: "grid", gap: "0.45rem" }}>
        <UpgradeButton plan={recommendedPlan} text={ctaLabel} />
        <a href={ctaHref} className="muted" style={{ fontSize: "0.82rem" }}>
          Compare plans
        </a>
      </div>
    </div>
  );
}
