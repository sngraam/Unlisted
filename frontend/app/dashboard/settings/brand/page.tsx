// Brand-context settings use the same form as onboarding to keep field definitions consistent.
import SettingsNav from "@/components/layout/SettingsNav";
import BrandContextForm from "@/components/brand/BrandContextForm";
export default function BrandSettingsPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Brand context</h1>
          <p>Your voice, your vocabulary, your standards.</p>
        </div>
      </div>
      <div className="settings-grid">
        <SettingsNav />
        <section className="panel settings-content">
          <div className="section-heading">
            <h2>Make every listing sound like you</h2>
            <p>
              These details guide your content and the listing review checks.
            </p>
          </div>
          <BrandContextForm />
        </section>
      </div>
    </>
  );
}
