"use client";
// Reused by the full settings page and the quick-settings dialog.
import { Plug } from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import MarketplaceBadge from "@/components/ui/MarketplaceBadge";

export default function WorkspaceSettingsContent() {
  const { profile, setProfile, connections, notify, ready, saving } =
    useWorkspace();

  if (!ready) return null;

  return (
    <>
      <section className="panel settings-panel">
        <div className="section-heading">
          <h2>Workspace details</h2>
          <p>Make this space your own.</p>
        </div>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
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
              { key: "email", label: "Email address", value: profile.email },
              {
                key: "workspace",
                label: "Workspace name",
                value: profile.workspace,
              },
              { key: "team", label: "Team name", value: profile.team },
            ].map((field) => (
              <label className="field" key={field.key}>
                <span className="field-label">{field.label}</span>
                <input
                  name={field.key}
                  readOnly={field.key === "email"}
                  required
                  defaultValue={field.value}
                  type={field.key === "email" ? "email" : "text"}
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
        {(["Amazon", "Flipkart"] as const).map((marketplace) => (
          <div className="connect-row" key={marketplace}>
            <Plug size={20} color="#848ba5" />
            <div>
              <MarketplaceBadge marketplace={marketplace} />
              <small>
                {connections.includes(marketplace) ? "Connected" : "Not connected"}
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
    </>
  );
}
