"use client";
// Route error boundary offers recovery without deleting saved local data.
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="empty-state">
      <h2>We couldn’t open this page.</h2>
      <p style={{ margin: "15px 0" }}>
        Your saved workspace data has not been removed.
      </p>
      <button className="btn primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
