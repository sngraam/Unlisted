"use client";
// Database-backed workspace/profile settings. Marketplace connection actions await seller OAuth.
import Link from "next/link";
import { ExternalLink, Plug, Check } from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import SettingsNav from "@/components/layout/SettingsNav";
import MarketplaceBadge from "@/components/ui/MarketplaceBadge";
export default function SettingsPage() {
  const { profile, setProfile, connections, notify, ready, saving } =
    useWorkspace();
  if (!ready) return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Workspace settings</h1>
          <p>The people, context, and stores behind your catalog.</p>
        </div>
        <Link className="btn" href="/onboarding/profile">
          Preview onboarding
          <ExternalLink size={14} />
        </Link>
      </div>
      <div className="settings-grid">
        <SettingsNav />
        <div className="settings-content">
          <section className="panel settings-panel">
            <div className="section-heading">
              <h2>Workspace details</h2>
              <p>Make this space your own.</p>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const saved = await setProfile({
                  name: String(data.get("name")).trim(),
                  email: String(data.get("email")).trim(),
                  workspace: String(data.get("workspace")).trim(),
                  team: String(data.get("team")).trim(),
                  type: String(data.get("type")),
                });
                if (saved) notify("Workspace details saved to PostgreSQL.");
              }}
            >
              <div className="form-grid">
                {[
                  { key: "name", label: "Display name", value: profile.name },
                  {
                    key: "email",
                    label: "Email address",
                    value: profile.email,
                  },
                  {
                    key: "workspace",
                    label: "Workspace name",
                    value: profile.workspace,
                  },
                  { key: "team", label: "Team name", value: profile.team },
                ].map((f) => (
                  <label className="field" key={f.key}>
                    <span className="field-label">{f.label}</span>
                    <input
                      name={f.key}
                      readOnly={f.key === "email"}
                      required
                      defaultValue={f.value}
                      type={f.key === "email" ? "email" : "text"}
                    />
                  </label>
                ))}
                <label className="field">
                  <span className="field-label">Account type</span>
                  <select name="type" defaultValue={profile.type}>
                    <option>Agency</option>
                    <option>Individual</option>
                    <option>Freelance</option>
                  </select>
                </label>
              </div>
              <button className="btn primary" type="submit" disabled={saving}>
                Save workspace
              </button>
            </form>
          </section>
          <section className="panel settings-panel">
            <div className="section-heading">
              <h2>Marketplace connections</h2>
              <p>Seller OAuth integration is not configured yet.</p>
            </div>
            {(["Amazon", "Flipkart"] as const).map((m) => (
              <div className="connect-row" key={m}>
                <Plug size={20} color="#848ba5" />
                <div>
                  <MarketplaceBadge marketplace={m} />
                  <small>
                    {connections.includes(m) ? "Connected" : "Not connected"}
                  </small>
                </div>
                <button
                  className="btn small"
                  disabled
                  title="Seller OAuth integration is not configured"
                >
                  Connection unavailable
                </button>
              </div>
            ))}
          </section>
          <div className="note info">
            Workspace details and catalog edits are saved in local PostgreSQL.
            Invitations and marketplace connections are still being built.
          </div>
        </div>
      </div>
    </>
  );
}
