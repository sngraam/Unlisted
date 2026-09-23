"use client";
// Step 2: capture the brand context used by future listing agents.
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import StepProgress from "@/components/layout/StepProgress";
import BrandContextForm from "@/components/brand/BrandContextForm";
export default function BrandPage() {
  const router = useRouter();
  return (
    <section className="auth-card wide">
      <Logo compact />
      <StepProgress step={2} />
      <div className="auth-heading">
        <span className="eyebrow">STEP 2 OF 4 · BRAND CONTEXT</span>
        <h1>Give your brand a voice</h1>
        <p>These facts guide every title, bullet, and description later.</p>
      </div>
      <BrandContextForm
        buttonLabel="Continue to marketplace setup"
        onSaved={() => router.push("/onboarding/connect")}
      />
      <div className="auth-foot">
        <Link className="text-link" href="/onboarding/profile">
          Back to profile
        </Link>
      </div>
    </section>
  );
}
