import { AgentOverview } from "@/app/components/dashboard/agent-overview";
import { DashboardShell } from "@/app/components/dashboard/dashboard-shell";
import { FeatureLock } from "@/app/components/access/feature-lock";
import { AccessStatePanel } from "@/app/components/dashboard/access-state-panel";
import { BotCreationPanel } from "@/app/components/dashboard/bot-creation-panel";
import { ChatPanel } from "@/app/components/dashboard/chat-panel";
import { ConnectorPanel } from "@/app/components/dashboard/connector-panel";
import { MemoryPanel } from "@/app/components/dashboard/memory-panel";
import { ObservabilityPanel } from "@/app/components/dashboard/observability-panel";
import { PermissionPanel } from "@/app/components/dashboard/permission-panel";
import { ProjectPanel } from "@/app/components/dashboard/project-panel";
import { cookies } from "next/headers";
import { AXIOM_ACCESS_TOKEN_COOKIE } from "@/server/auth/session";
import { verifyAccessToken } from "@/server/auth/verify";
import { resolveUserEntitlementState } from "@/server/entitlements/service";

export default async function WorkspacePage() {
  const fallback = await resolveUserEntitlementState("workspace-user");

  let snapshot = fallback;
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(AXIOM_ACCESS_TOKEN_COOKIE)?.value;
    const verified = accessToken ? await verifyAccessToken(accessToken) : null;

    if (verified) {
      const inferredRole = verified.email?.endsWith("@imdev.studio")
        ? "admin"
        : "user";
      snapshot = await resolveUserEntitlementState(verified.id, inferredRole);
    }
  } catch {
    snapshot = fallback;
  }

  return (
    <DashboardShell>
      <header style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <span className="pill workspace-header-pill">Axiom Workspace</span>
            <h1
              style={{
                margin: "0.6rem 0 0.3rem",
                fontSize: "2rem",
                letterSpacing: "-0.02em",
              }}
            >
              AI Operations Control Plane
            </h1>
            <p
              className="muted"
              style={{ maxWidth: 680, margin: 0, lineHeight: 1.55 }}
            >
              Orchestrate agents, enforce approvals, observe every run —
              policy-driven, end to end.
            </p>
          </div>
          <form action="/api/v1/auth/signout" method="post">
            <button
              type="submit"
              className="btn-primary"
              style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section
        className="grid"
        style={{ gridTemplateColumns: "2fr 1fr", marginBottom: "1rem" }}
      >
        <ChatPanel />
        <AgentOverview />
      </section>

      <section
        className="grid"
        style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: "1rem" }}
      >
        <ProjectPanel />
        {snapshot.features["memory.long_term"] ? (
          <MemoryPanel />
        ) : (
          <FeatureLock
            title="Memory and Knowledge"
            description="Long-term memory is gated for free demo users."
            recommendedPlan="pro"
          />
        )}
        {snapshot.features["connectors.premium"] ? (
          <ConnectorPanel />
        ) : (
          <FeatureLock
            title="Connectors and Settings"
            description="Connector features are available only for internal access."
            recommendedPlan="pro"
          />
        )}
      </section>

      <section
        className="grid"
        style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: "1rem" }}
      >
        <AccessStatePanel snapshot={snapshot} />
        <PermissionPanel />
        <ObservabilityPanel />
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <BotCreationPanel />
      </section>
    </DashboardShell>
  );
}
