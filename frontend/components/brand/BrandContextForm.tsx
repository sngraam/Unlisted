"use client";
// Brand vocabulary and constraints are shared by onboarding, settings and local validation.
import { useWorkspace } from "@/lib/stores/workspaceStore";
export default function BrandContextForm({
  onSaved,
  buttonLabel = "Save brand context",
}: {
  onSaved?: () => void;
  buttonLabel?: string;
}) {
  const { brand, setBrand, notify, ready, saving } = useWorkspace();
  if (!ready) return null;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const saved = await setBrand({
          name: String(data.get("name")).trim(),
          tone: String(data.get("tone")),
          glossary: String(data.get("glossary")).trim(),
          bannedTerms: String(data.get("bannedTerms")).trim(),
          painPoints: String(data.get("painPoints")).trim(),
          revenueRange: String(data.get("revenueRange") || "").trim(),
          competitors: String(data.get("competitors") || "").trim(),
          targetAgeMin: String(data.get("targetAgeMin") || "").trim(),
          targetAgeMax: String(data.get("targetAgeMax") || "").trim(),
          targetCountries: String(data.get("targetCountries") || "").trim(),
        });
        if (!saved) return;
        notify("Brand context saved to PostgreSQL.");
        onSaved?.();
      }}
    >
      <label className="field">
        <span className="field-label">Brand name</span>
        <input name="name" required defaultValue={brand.name} />
      </label>
      <label className="field">
        <span className="field-label">Tone of voice</span>
        <select name="tone" defaultValue={brand.tone}>
          {[
            "Warm & authentic",
            "Professional & clear",
            "Playful & expressive",
            "Premium & refined",
            "Simple & practical",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Brand glossary</span>
        <textarea
          name="glossary"
          defaultValue={brand.glossary}
          placeholder="Words and phrases that sound like your brand"
        />
        <span className="field-hint">
          Separate words or phrases with commas.
        </span>
      </label>
      <label className="field">
        <span className="field-label">Banned words & claims</span>
        <input
          name="bannedTerms"
          defaultValue={brand.bannedTerms}
          placeholder="e.g. guaranteed, miracle, cure"
        />
        <span className="field-hint">
          The review audit checks listings for these terms.
        </span>
      </label>
      <label className="field">
        <span className="field-label">Customer needs & pain points</span>
        <textarea name="painPoints" defaultValue={brand.painPoints} />
      </label>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">Annual brand revenue</span>
          <select name="revenueRange" defaultValue={brand.revenueRange}>
            <option value="">Choose a range</option>
            <option>Under ₹10L</option>
            <option>₹10L–₹50L</option>
            <option>₹50L–₹2Cr</option>
            <option>₹2Cr–₹10Cr</option>
            <option>Over ₹10Cr</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Target countries</span>
          <input name="targetCountries" defaultValue={brand.targetCountries} placeholder="India, UAE" />
        </label>
        <label className="field">
          <span className="field-label">Target age, from</span>
          <input name="targetAgeMin" inputMode="numeric" defaultValue={brand.targetAgeMin} placeholder="18" />
        </label>
        <label className="field">
          <span className="field-label">Target age, to</span>
          <input name="targetAgeMax" inputMode="numeric" defaultValue={brand.targetAgeMax} placeholder="45" />
        </label>
      </div>
      <label className="field">
        <span className="field-label">Main competitors</span>
        <input name="competitors" defaultValue={brand.competitors} placeholder="Brand A, Brand B" />
        <span className="field-hint">Separate competitors with commas.</span>
      </label>
      <button className="btn primary" type="submit" disabled={saving}>
        {buttonLabel}
      </button>
    </form>
  );
}
