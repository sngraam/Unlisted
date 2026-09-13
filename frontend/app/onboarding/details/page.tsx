"use client";
// Step 2: collects display name, team and workspace fields separately for schema discovery.
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import StepProgress from "@/components/layout/StepProgress";
import { useWorkspace } from "@/lib/stores/workspaceStore";
export default function DetailsPage() {
  const { profile, setProfile, ready } = useWorkspace();
  const router = useRouter();
  if (!ready) return null;
  return (
    <section className="auth-card wide">
      <Logo compact />
      <StepProgress step={2} />
      <div className="auth-heading">
        <h1>Make yourself at home</h1>
        <p>A little context for your new workspace.</p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const saved = await setProfile({
            ...profile,
            name: String(data.get("name")).trim(),
            email: String(data.get("email")).trim(),
            workspace: String(data.get("workspace")).trim(),
            team: String(data.get("team")).trim(),
          });
          if (!saved) return;
          router.push("/onboarding/brand");
        }}
      >
        {[
          { key: "name", label: "Your name", value: profile.name },
          { key: "email", label: "Email address", value: profile.email },
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
              defaultValue={f.value}
              required
              type={f.key === "email" ? "email" : "text"}
            />
          </label>
        ))}
        <button className="btn primary full">Continue to brand context</button>
        <div className="auth-foot">
          <Link href="/onboarding/profile" className="text-link">
            Back to profile
          </Link>
        </div>
      </form>
    </section>
  );
}
