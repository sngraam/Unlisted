"use client";
// Step 3: establish brand voice before generating any listing content.
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
      <StepProgress step={3} />
      <div className="auth-heading">
        <h1>Give your brand a voice</h1>
        <p>Keep every product listing recognizably yours.</p>
      </div>
      <BrandContextForm
        buttonLabel="Continue to marketplaces"
        onSaved={() => router.push("/onboarding/connect")}
      />
      <div className="auth-foot">
        <Link className="text-link" href="/onboarding/details">
          Back to workspace details
        </Link>
      </div>
    </section>
  );
}
