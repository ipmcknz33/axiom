"use client";

import { useState } from "react";

type WorkflowRun = {
  id: string;
  name: string;
  status: "success" | "running" | "failed";
  durationMs: number;
  timestamp: string;
};

const DEMO_WORKFLOWS = [
  "Weekly Report Digest",
  "Invoice Reconciliation",
  "Lead Qualification",
  "Incident Escalation",
];

const DEMO_HEADERS = {
  "Content-Type": "application/json",
  "x-axiom-role": "admin",
  "x-axiom-user-id": "11111111-1111-4111-8111-111111111111",
};

const STATUS_COLOR: Record<WorkflowRun["status"], string> = {
  success: "#86efac",
  running: "#60a5fa",
  failed: "#fda4af",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function WorkflowsPanel() {
  const [selected, setSelected] = useState(DEMO_WORKFLOWS[0]);
  const [busy, setBusy] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);

  async function runWorkflow() {
    setBusy(true);
    const runId = uid();
    const pending: WorkflowRun = {
      id: runId,
      name: selected,
      status: "running",
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };
    setRuns((prev) => [pending, ...prev]);

    try {
      const start = Date.now();
      await fetch("/api/v1/chat", {
        method: "POST",
        headers: DEMO_HEADERS,
        body: JSON.stringify({
          message: `Run a demo workflow: ${selected}`,
          userId: "11111111-1111-4111-8111-111111111111",
        }),
      });
      const durationMs = Date.now() - start;
      setRuns((prev) =>
        prev.map((r) =>
          r.id === runId ? { ...r, status: "success", durationMs } : r,
        ),
      );
    } catch {
      setRuns((prev) =>
        prev.map((r) => (r.id === runId ? { ...r, status: "failed" } : r)),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0, marginBottom: "0.85rem" }}>
        Workflow Executor
      </h3>

      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{
            background: "var(--panel-soft)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
            padding: "0.45rem 0.65rem",
            flex: 1,
            minWidth: 200,
          }}
        >
          {DEMO_WORKFLOWS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <button
          className="btn-primary"
          onClick={runWorkflow}
          disabled={busy}
          style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}
        >
          {busy ? "Running…" : "Run Test"}
        </button>
      </div>

      <h4
        style={{
          margin: "0 0 0.6rem",
          fontSize: "0.85rem",
          color: "var(--muted)",
        }}
      >
        Recent Runs
      </h4>

      {runs.length === 0 && (
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          No runs yet. Select a workflow and hit Run Test.
        </p>
      )}

      <div style={{ display: "grid", gap: "0.5rem" }}>
        {runs.map((run) => (
          <div
            key={run.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px dashed var(--border)",
              paddingBottom: "0.45rem",
              gap: "0.5rem",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.88rem" }}>
                {run.name}
              </div>
              <div className="muted" style={{ fontSize: "0.75rem" }}>
                {new Date(run.timestamp).toLocaleTimeString()}
                {run.durationMs > 0 && ` · ${run.durationMs}ms`}
              </div>
            </div>
            <span
              style={{
                color: STATUS_COLOR[run.status],
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {run.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
