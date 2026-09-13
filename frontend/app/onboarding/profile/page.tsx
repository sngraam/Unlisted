"use client";
// Step 1: choose profile type. Persisted locally to inform the future user/team schema.
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  UserRound,
  BriefcaseBusiness,
  Check,
  ArrowRight,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import StepProgress from "@/components/layout/StepProgress";
import { useWorkspace } from "@/lib/stores/workspaceStore";
export default function ProfilePage() {
  const { profile, setProfile, ready } = useWorkspace();
  const [choice, setChoice] = useState<string | null>(null);
  // Read hydrated profile data until the user makes a new choice.
  const type = choice ?? profile.type;
  const router = useRouter();
  if (!ready) return <div className="loading-state">Loading your profile…</div>;
  return (
    <section className="auth-card wide">
      <Logo compact />
      <StepProgress step={1} />
      <div className="auth-heading">
        <h1>How do you work?</h1>
        <p>Let’s shape a workspace around you.</p>
      </div>
      {[
        {
          name: "Individual",
          detail: "Build and manage your own product catalog.",
          icon: UserRound,
        },
        {
          name: "Agency",
          detail: "Manage brands and listings with your team.",
          icon: Building2,
        },
        {
          name: "Freelance",
          detail: "Create great listings for your clients.",
          icon: BriefcaseBusiness,
        },
      ].map(({ name, detail, icon: Icon }) => (
        <button
          key={name}
          className={"choice-card " + (type === name ? "selected" : "")}
          onClick={() => setChoice(name)}
          aria-pressed={type === name}
        >
          <Icon size={22} color="#9699ff" />
          <span>
            <strong>{name}</strong>
            <small>{detail}</small>
          </span>
          {type === name && <Check size={17} color="#9699ff" />}
        </button>
      ))}
      <button
        className="btn primary full"
        style={{ marginTop: 20 }}
        onClick={async () => {
          if (!(await setProfile({ ...profile, type }))) return;
          router.push("/onboarding/details");
        }}
      >
        Continue
        <ArrowRight size={15} />
      </button>
    </section>
  );
}
