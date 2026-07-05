// The global error surface. Plain and honest: it says what failed without
// pretending to know the cause, and offers a retry when one is wired.
export function ErrorPanel({
  title = "Something did not load",
  message,
  children,
}: {
  title?: string;
  message?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="error-panel" role="alert">
      <p className="error-title">{title}</p>
      <p className="notice-body">
        {message ?? "The data layer returned an error. The marts may be mid-refresh; try again."}
      </p>
      {children ? <div style={{ marginTop: "var(--space-4)" }}>{children}</div> : null}
    </div>
  );
}
