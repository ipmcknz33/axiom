type SignInPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getErrorMessage(error: string | undefined) {
  switch (error) {
    case "oauth_start_failed":
      return "Could not start Google sign-in. Please try again.";
    case "missing_code":
      return "Google callback is missing an authorization code.";
    case "oauth_callback_failed":
      return "Could not complete Google sign-in. Please try again.";
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
          Continue with Google to enter your protected workspace and access
          entitlement-based controls.
        </p>
        {message ? (
          <p style={{ color: "#f87171", marginTop: "0.75rem" }}>{message}</p>
        ) : null}
        <a
          className="pill"
          href="/api/v1/auth/google/start"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            textDecoration: "none",
          }}
        >
          Continue with Google
        </a>
      </section>
    </main>
  );
}
