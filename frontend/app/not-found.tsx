// Safe fallback for unknown routes; helps users recover without losing their local workspace.
import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth-screen">
      <h1>This page isn’t in your workspace.</h1>
      <p className="muted" style={{ margin: "15px 0 25px" }}>
        Let’s get you back to your products.
      </p>
      <Link className="btn primary" href="/dashboard/skus">
        Open product catalog
      </Link>
    </main>
  );
}
