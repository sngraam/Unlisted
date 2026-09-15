"use client";
// Password sign-in uses a same-origin server route and an HttpOnly session cookie.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCircle2, KeyRound, Eye, EyeOff, LockKeyhole } from "lucide-react";
import Logo from "@/components/ui/Logo";
export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <Logo compact />
        <div className="auth-heading">
          <h1>{signup ? "Your workspace awaits" : "Invite-only access"}</h1>
          <p>
            {signup
              ? "Use your invitation to join your team and create marketplace-ready listings."
              : "Enter your login ID and password to continue. This workspace is available to invited sellers."}
          </p>
          <span className="auth-badge">
            <LockKeyhole size={11} />
            Invite required
          </span>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              if (signup)
                throw new Error(
                  "Invitation registration is not available yet. Sign in with your assigned account.",
                );
              const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  identifier: name.trim().toLowerCase(),
                  password,
                }),
              });
              const result = await response.json();
              if (!response.ok)
                throw new Error(result.error || "Sign-in failed.");
              setPassword("");
              window.location.assign("/dashboard/skus");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Cannot reach the server.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {signup && (
            <label className="field">
              <span className="field-label">Invitation code</span>
              <input
                required
                placeholder="Paste your invitation code"
                autoComplete="off"
              />
            </label>
          )}
          <label className="field">
            <span className="field-label">
              {signup ? "Display name" : "Login ID"}
            </span>
            <div className="input-with-icon">
              <UserCircle2 size={16} />
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={signup ? "Your name" : "Enter your login ID"}
                type="text"
                autoComplete="username"
              />
            </div>
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <div className="input-with-icon">
              <KeyRound size={16} />
              <input
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                type={visible ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn primary full"
            type="submit"
            disabled={busy || signup}
          >
            {busy
              ? "Signing in…"
              : signup
                ? "Invitations coming soon"
                : "Sign in"}
          </button>
        </form>
        <div className="auth-foot">
          {signup
            ? "Already have an account?"
            : "Need access? Ask your workspace admin for an invite."}
          <br />
          <Link className="text-link" href={signup ? "/login" : "/signup"}>
            {signup ? "Sign in" : "Use an invitation"}
          </Link>
        </div>
      </section>
      <div className="auth-bottom">
        <span>AI Listing Agent</span>
        <span>Thoughtful listings. Less busywork.</span>
      </div>
    </main>
  );
}
