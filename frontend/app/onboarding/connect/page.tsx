"use client";
// Step 4: marketplace OAuth remains unavailable until a real seller integration is implemented.
import Link from "next/link";
import { ChevronRight, Check, LockKeyhole } from "lucide-react";
import Logo from "@/components/ui/Logo";
import StepProgress from "@/components/layout/StepProgress";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import { Marketplace } from "@/types/sku";
export default function ConnectPage() {
  const { connections, notify } = useWorkspace();
  return (
    <section className="auth-card">
      <Logo compact />
      <StepProgress step={4} />
      <div className="auth-heading">
        <span className="eyebrow" style={{ color: "#9b9eff" }}>
          ONE LAST THING
        </span>
        <h1 style={{ marginTop: 12 }}>Connect your store</h1>
        <p>
          Bring your products together. Prepare listings for the marketplaces
          you sell on.
        </p>
      </div>
      {(["Flipkart", "Amazon"] as Marketplace[]).map((m) => (
        <button
          className={
            "choice-card " + (connections.includes(m) ? "selected" : "")
          }
          key={m}
          disabled
          title="Seller OAuth integration is not configured yet"
        >
          <span className={"market-icon " + m.toLowerCase()}>
            {m === "Amazon" ? "a" : "F"}
          </span>
          <span>
            <strong>
              {connections.includes(m) ? m + " · Connected" : "Connect " + m}
            </strong>
            <small>
              {m === "Amazon"
                ? "Prepare your Amazon catalog"
                : "Prepare your Flipkart catalog"}
            </small>
          </span>
          {connections.includes(m) ? (
            <Check size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
      ))}
      <Link
        href="/dashboard/skus"
        className={"btn full " + (connections.length ? "primary" : "subtle")}
        style={{ marginTop: 17 }}
      >
        {connections.length
          ? "Open my workspace"
          : "Skip for now, I’ll connect later"}
      </Link>
      <p
        className="auth-foot"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <LockKeyhole size={12} />
        Seller connections are not configured yet.
      </p>
    </section>
  );
}
