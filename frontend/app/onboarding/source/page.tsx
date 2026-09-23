"use client";
// Onboarding step 4: acquisition attribution, saved with the workspace setup record.
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search, Phone, Facebook, Mail, Instagram, HelpCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";
import StepProgress from "@/components/layout/StepProgress";
import { useWorkspace } from "@/lib/stores/workspaceStore";

const sources = [
  ["google", "Google", Search], ["cold-call", "Cold call", Phone], ["facebook", "Facebook", Facebook],
  ["cold-email", "Cold email", Mail], ["instagram", "Instagram", Instagram], ["other", "Other", HelpCircle],
] as const;

export default function SourcePage() {
  const { setOnboarding, saving } = useWorkspace();
  const router = useRouter();
  const params = useSearchParams();
  const marketplaces = (params.get("marketplaces") || "").split(",").filter((item): item is "Amazon" | "Flipkart" => item === "Amazon" || item === "Flipkart");
  const [source, setSource] = useState("");
  const [other, setOther] = useState("");
  return (
    <section className="auth-card wide onboarding-card">
      <Logo compact />
      <StepProgress step={4} />
      <div className="auth-heading">
        <span className="eyebrow">STEP 4 OF 4 · LAST QUESTION</span>
        <h1>How did you find us?</h1>
        <p>This helps us make the workspace more useful for you.</p>
      </div>
      <div className="source-grid">
        {sources.map(([value, label, Icon]) => <button type="button" key={value} className={`source-card ${source === value ? "selected" : ""}`} onClick={() => setSource(value)} aria-pressed={source === value}><Icon size={17} /><span>{label}</span></button>)}
      </div>
      {source === "other" && <label className="field"><span className="field-label">Tell us where</span><input value={other} onChange={(event) => setOther(event.target.value)} placeholder="A friend, event, community…" required /></label>}
      <button className="btn primary full" disabled={!source || saving} onClick={async () => { if (await setOnboarding({ source, other, marketplaces })) router.replace("/dashboard"); }}>
        Finish setup <ArrowRight size={15} />
      </button>
      <div className="auth-foot"><span>{marketplaces.length ? `${marketplaces.join(" + ")} selected` : "No marketplace selected"}</span></div>
    </section>
  );
}
