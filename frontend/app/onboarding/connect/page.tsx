"use client";
// Step 3: choose target channels. OAuth can be attached later without changing intake data.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check, ArrowRight, Store } from "lucide-react";
import Logo from "@/components/ui/Logo";
import StepProgress from "@/components/layout/StepProgress";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import { Marketplace } from "@/types/sku";
export default function ConnectPage() {
  const { connections } = useWorkspace();
  const router = useRouter();
  const [selected, setSelected] = useState<Marketplace[]>(connections.length ? connections : ["Amazon"]);
  return (
    <section className="auth-card wide onboarding-card">
      <Logo compact />
      <StepProgress step={3} />
      <div className="auth-heading">
        <span className="eyebrow">STEP 3 OF 4 · MARKETPLACES</span>
        <h1>Where do you sell?</h1>
        <p>Choose a target channel now. Seller sign-in can be connected later.</p>
      </div>
      {(["Flipkart", "Amazon"] as Marketplace[]).map((m) => (
        <button
          type="button"
          className={"choice-card " + (selected.includes(m) ? "selected" : "")}
          key={m}
          onClick={() => setSelected((current) => current.includes(m) ? current.filter((item) => item !== m) : [...current, m])}
          aria-pressed={selected.includes(m)}
        >
          <span className={"market-icon " + m.toLowerCase()}>{m === "Amazon" ? "a" : "F"}</span>
          <span>
            <strong>{selected.includes(m) ? m + " · Selected" : "Prepare for " + m}</strong>
            <small>{m === "Amazon" ? "Amazon India listing requirements" : "Flipkart listing requirements"}</small>
          </span>
          {selected.includes(m) ? <Check size={16} /> : <ChevronRight size={16} />}
        </button>
      ))}
      <button type="button" className="btn primary full" style={{ marginTop: 17 }} onClick={() => router.push(`/onboarding/source?marketplaces=${encodeURIComponent(selected.join(","))}`)}>
        {selected.length ? "Continue" : "Skip for now"} <ArrowRight size={15} />
      </button>
      <p className="auth-foot"><Store size={12} style={{ verticalAlign: "-2px" }} /> You can connect seller accounts from Settings.</p>
    </section>
  );
}
