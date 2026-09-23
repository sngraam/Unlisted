"use client";
// Onboarding step 1: identify the person and the kind of workspace they own.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, BriefcaseBusiness, UserRound } from "lucide-react";
import Logo from "@/components/ui/Logo";
import StepProgress from "@/components/layout/StepProgress";
import { useWorkspace } from "@/lib/stores/workspaceStore";
const types = [
  { value: "Individual", label: "Individual", detail: "Build and manage your own brand.", icon: UserRound },
  { value: "Agency", label: "Agency", detail: "Manage several brands with a team.", icon: Building2 },
  { value: "Freelance", label: "Freelance", detail: "Create listings for your clients.", icon: BriefcaseBusiness },
];
export default function ProfilePage() {
  const { profile, setProfile, ready, saving } = useWorkspace();
  const [type, setType] = useState(profile.type || "Individual");
  const router = useRouter();
  if (!ready) return <div className="loading-state">Loading your profile…</div>;
  return (
    <section className="auth-card wide onboarding-card">
      <Logo compact />
      <StepProgress step={1} />
      <div className="auth-heading">
        <span className="eyebrow">STEP 1 OF 4 · YOUR PROFILE</span>
        <h1>Let’s set up your workspace</h1>
        <p>Tell us who will own and guide this brand.</p>
      </div>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const saved = await setProfile({ ...profile, name: String(data.get("name")).trim(), email: String(data.get("email")).trim(), type });
        if (saved) router.push("/onboarding/brand");
      }}>
        <div className="form-grid">
          <label className="field"><span className="field-label">Display name</span><input name="name" required defaultValue={profile.name} placeholder="Your name" /></label>
          <label className="field"><span className="field-label">Email address</span><input name="email" required readOnly type="email" defaultValue={profile.email} /></label>
        </div>
        <div className="field-label" style={{ margin: "20px 0 9px" }}>Account type</div>
        <div className="choice-grid">
          {types.map(({ value, label, detail, icon: Icon }) => <button type="button" key={value} className={`choice-card ${type === value ? "selected" : ""}`} onClick={() => setType(value)} aria-pressed={type === value}><Icon size={20} color="#9699ff" /><span><strong>{label}</strong><small>{detail}</small></span></button>)}
        </div>
        <button className="btn primary full" style={{ marginTop: 22 }} disabled={saving}>Continue to brand context <ArrowRight size={15} /></button>
      </form>
    </section>
  );
}
