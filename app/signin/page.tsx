type SignInPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getErrorMessage(error: string | undefined) {
  switch (error) {
    case "session_required":
      return "A valid session is required to access the protected workspace.";
    default:
      return null;
  }
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const error = searchParams?.error;
  const normalizedError = Array.isArray(error) ? error[0] : error;
  const message = getErrorMessage(normalizedError);

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "80vh",
        padding: "1rem",
      }}
    >
      <section className="panel" style={{ width: "100%", maxWidth: 460 }}>
        <h1 style={{ marginTop: 0 }}>Sign In to Axiom</h1>
        <p className="muted" style={{ lineHeight: 1.55 }}>
          This environment is a private orchestrator demo. Access is managed by
          issued session cookies and role-bound entitlements.
        </p>
        {message ? (
          <p style={{ color: "#f87171", marginTop: "0.75rem" }}>{message}</p>
        ) : null}
        <a
          className="pill"
          href="/app"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            textDecoration: "none",
          }}
        >
          Enter Workspace
        </a>
      </section>
    </main>
  );
}
