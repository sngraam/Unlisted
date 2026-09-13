"use client";
// Main listing workspace. Draft edits stay local until saved; editing invalidates prior approval.
// Generation uses a deterministic sample, not an LLM. Replace generate() with a queued API action later.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Shirt,
  Package,
  Check,
  RotateCw,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { Product } from "@/types/sku";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import { auditListing, auditScore } from "@/lib/validation";
import SkuStatusBadge from "@/components/sku/SkuStatusBadge";
import MarketplaceBadge from "@/components/ui/MarketplaceBadge";
import ValidationErrors from "./ValidationErrors";
import PublishSelector from "./PublishSelector";
import VariantEditor from "./VariantEditor";
function Editor({ initial, review }: { initial: Product; review: boolean }) {
  const { brand, products, updateProduct, notify, saving } = useWorkspace();
  const [draft, setDraft] = useState<Product>(initial);
  const [tab, setTab] = useState("Listing content");
  const sections = ["Listing content", "Variants & pricing", "Product details"];
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [busy, setBusy] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const checks = auditListing(draft, brand.bannedTerms);
  const score = auditScore(checks);
  const blocking = checks.some((c) => !c.passed && c.severity === "error");
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  function patch(value: Partial<Product>) {
    // Typing while sample generation is pending takes precedence over the delayed result.
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
      setBusy("");
    }
    setDraft((p) => ({ ...p, ...value, approved: false }));
    setDirty(true);
  }
  async function save() {
    if (saving) return false;
    if (!dirty) return true;
    const otherSkus = new Set(
      products
        .filter((p) => p.id !== draft.id)
        .flatMap((p) => p.variants.map((v) => v.sku.toLowerCase().trim())),
    );
    if (draft.variants.some((v) => otherSkus.has(v.sku.toLowerCase().trim()))) {
      notify(
        "A variant SKU already exists in another product. Use unique SKUs.",
      );
      return false;
    }
    const value = {
      ...draft,
      sku: draft.variants[0]?.sku || draft.sku,
      score,
      // Content edits can change readiness; a no-op save preserves the existing lifecycle.
      status: dirty
        ? ((blocking ? "Draft" : "Ready") as Product["status"])
        : draft.status,
      approved: dirty ? false : draft.approved,
    };
    const saved = await updateProduct(draft.id, value);
    if (!saved) return false;
    setDraft(saved);
    setDirty(false);
    notify("Listing saved to PostgreSQL.");
    return true;
  }
  function generate(field: string) {
    setBusy(field);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      if (field === "title")
        patch({
          title:
            draft.brand +
            " " +
            (draft.name.toLowerCase().startsWith(draft.brand.toLowerCase())
              ? draft.name.slice(draft.brand.length)
              : draft.name
            ).trim(),
        });
      else if (field === "description")
        patch({
          description:
            draft.description +
            " " +
            draft.brand +
            " " +
            draft.category.split(" > ").pop() +
            ". Available in " +
            draft.variants.length +
            " variant" +
            (draft.variants.length === 1 ? "" : "s") +
            ". Review the material, sizing, care, and included items against your supplier specifications before publishing.",
        });
      else if (field === "keywords")
        patch({
          keywords: [
            draft.brand,
            draft.category.split(" > ").pop(),
            draft.variants[0]?.color,
            draft.variants[0]?.size,
          ]
            .filter(Boolean)
            .join(", "),
        });
      else {
        const i = Number(field);
        const bullets = Array.from(
          { length: 5 },
          (_, n) => draft.bullets[n] || "",
        );
        bullets[i] = [
          "From " + draft.brand + ": " + draft.name + ".",
          "Choose your preferred option from the available product variants.",
          "Review the product details to confirm suitability for your needs.",
          "Check the size and specifications before placing your order.",
          "Follow the care instructions supplied with your product.",
        ][i];
        patch({ bullets });
      }
      setBusy("");
      notify("Sample copy inserted. Verify every product claim.");
    }, 650);
  }
  const generateButton = (field: string) => (
    <div className="generate-row">
      <button
        className="generate-button"
        disabled={!!busy}
        onClick={() => generate(field)}
      >
        {busy === field ? (
          <Loader2 className="spin" size={12} />
        ) : (
          <Sparkles size={12} />
        )}
        Generate sample
      </button>
    </div>
  );
  return (
    <>
      <div className="editor-top">
        <Link
          href="/dashboard/skus"
          className="back-link"
          onClick={(e) => {
            if (dirty && !window.confirm("Leave without saving your edits?"))
              e.preventDefault();
          }}
        >
          <ArrowLeft size={15} />
          Back to catalog
        </Link>
        <div className="actions">
          <span className="muted" style={{ fontSize: 11 }}>
            {dirty ? "Unsaved changes" : "Saved to PostgreSQL"}
          </span>
          <button className="btn small" onClick={save} disabled={saving}>
            <Save size={14} />
            Save changes
          </button>
        </div>
      </div>
      <div className="editor-grid">
        <aside>
          <div className="panel product-summary">
            <div className="product-preview">
              {draft.image ? (
                <img src={draft.image} alt={draft.name} />
              ) : (
                <>
                  {draft.category.includes("Ethnic") ? (
                    <Shirt size={79} strokeWidth={0.8} />
                  ) : (
                    <Package size={79} strokeWidth={0.8} />
                  )}
                  <span className="preview-label">PRODUCT IMAGE</span>
                </>
              )}
            </div>
            <div className="sku-code" style={{ marginTop: 14 }}>
              {draft.sku}
            </div>
            <h3>{draft.name}</h3>
            <SkuStatusBadge status={draft.status} />
          </div>
          <div className="panel detail-card">
            <div className="eyebrow">PRODUCT DETAILS</div>
            <dl>
              <dt>Brand</dt>
              <dd>{draft.brand}</dd>
              <dt>Category</dt>
              <dd>{draft.category}</dd>
              <dt>Target channel</dt>
              <dd>
                <MarketplaceBadge marketplace={draft.marketplace} />
              </dd>
              <dt>Variants</dt>
              <dd>
                {draft.variants.length} variant
                {draft.variants.length === 1 ? "" : "s"}
              </dd>
              <dt>Last updated</dt>
              <dd>
                {new Date(draft.updatedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </dd>
            </dl>
          </div>
        </aside>
        <section>
          <div className="editor-heading">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {review ? "FINAL REVIEW" : "YOUR LISTING, REFINED"}
            </div>
            <h1>AI copywriter workshop</h1>
            <p>Fine-tune your content. Keep your brand’s voice.</p>
          </div>
          <div
            className="editor-tabs"
            role="tablist"
            aria-label="Editor sections"
          >
            {sections.map((t, index) => (
              <button
                role="tab"
                id={`editor-tab-${index}`}
                aria-controls={`editor-panel-${index}`}
                tabIndex={tab === t ? 0 : -1}
                aria-selected={tab === t}
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? sections.length - 1
                        : event.key === "ArrowRight"
                          ? (index + 1) % sections.length
                          : event.key === "ArrowLeft"
                            ? (index + sections.length - 1) % sections.length
                            : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  setTab(sections[next]);
                  event.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                    [next]?.focus();
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Listing content" && (
            <div
              className="panel"
              role="tabpanel"
              id="editor-panel-0"
              aria-labelledby="editor-tab-0"
            >
              <label className="editor-field" style={{ display: "block" }}>
                <span className="field-label">
                  Product title<span>{draft.title.length}/200</span>
                </span>
                <textarea
                  aria-label="Product title"
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                />
                {generateButton("title")}
              </label>
              <div className="bullet-heading">
                Key bullet points{" "}
                <span className="muted" style={{ fontSize: 10 }}>
                  {" "}
                  / 5 product benefits
                </span>
              </div>
              {Array.from({ length: 5 }, (_, i) => (
                <label
                  className="editor-field"
                  style={{ display: "block" }}
                  key={i}
                >
                  <span className="field-label">
                    {
                      [
                        "Material & quality",
                        "Design & features",
                        "Everyday benefits",
                        "Size & compatibility",
                        "Care & use",
                      ][i]
                    }
                    <span>{(draft.bullets[i] || "").length} characters</span>
                  </span>
                  <textarea
                    aria-label={`Bullet point ${i + 1}`}
                    value={draft.bullets[i] || ""}
                    onChange={(e) => {
                      const bullets = Array.from(
                        { length: 5 },
                        (_, n) => draft.bullets[n] || "",
                      );
                      bullets[i] = e.target.value;
                      patch({ bullets });
                    }}
                  />
                  {generateButton(String(i))}
                </label>
              ))}
              <label className="editor-field" style={{ display: "block" }}>
                <span className="field-label">
                  Product description
                  <span>{draft.description.length} characters</span>
                </span>
                <textarea
                  aria-label="Product description"
                  style={{ minHeight: 190 }}
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                />
                {generateButton("description")}
              </label>
              <label className="editor-field" style={{ display: "block" }}>
                <span className="field-label">Search keywords</span>
                <textarea
                  aria-label="Search keywords"
                  value={draft.keywords}
                  onChange={(e) => patch({ keywords: e.target.value })}
                />
                <span className="field-hint">
                  Separate terms with commas. Keep them relevant to your
                  product.
                </span>
                {generateButton("keywords")}
              </label>
              <div className="note info">
                <Sparkles size={15} />
                Sample generation previews the workflow. Live AI and A+ content
                generation are not connected.
              </div>
            </div>
          )}
          {tab === "Variants & pricing" && (
            <div
              className="panel"
              role="tabpanel"
              id="editor-panel-1"
              aria-labelledby="editor-tab-1"
            >
              <div className="section-heading">
                <h2>Variant details</h2>
                <p>
                  Keep prices, options, and inventory attached to a unique SKU.
                </p>
              </div>
              <VariantEditor
                variants={draft.variants}
                onChange={(variants) => patch({ variants })}
              />
            </div>
          )}
          {tab === "Product details" && (
            <div
              className="panel"
              role="tabpanel"
              id="editor-panel-2"
              aria-labelledby="editor-tab-2"
            >
              <div className="section-heading">
                <h2>Merchant facts</h2>
                <p>
                  Verified product details are the foundation of a good listing.
                </p>
              </div>
              <div className="form-grid">
                {[
                  { key: "brand", label: "Brand" },
                  { key: "category", label: "Category path" },
                  { key: "hsn", label: "HSN code" },
                  { key: "origin", label: "Country of origin" },
                ].map((f) => (
                  <label className="field" key={f.key}>
                    <span className="field-label">{f.label}</span>
                    <input
                      value={String(draft[f.key as keyof Product])}
                      onChange={(e) => patch({ [f.key]: e.target.value })}
                    />
                  </label>
                ))}
                <label className="field">
                  <span className="field-label">Weight (kg)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.weight}
                    onChange={(e) => patch({ weight: Number(e.target.value) })}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Marketplace</span>
                  <select
                    value={draft.marketplace}
                    onChange={(e) =>
                      patch({
                        marketplace: e.target.value as Product["marketplace"],
                      })
                    }
                  >
                    <option>Amazon</option>
                    <option>Flipkart</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span className="field-label">Original product notes</span>
                <textarea
                  value={draft.rawText}
                  onChange={(e) => patch({ rawText: e.target.value })}
                />
              </label>
              <label className="dropzone">
                <UploadCloud size={23} />
                <strong>Upload a product image</strong>
                <p>JPG, PNG or WebP · Maximum 1 MB for this preview</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (
                      file.size > 1024 * 1024 ||
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        file.type,
                      )
                    ) {
                      notify("Choose a JPG, PNG or WebP image under 1 MB.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () =>
                      patch({ image: String(reader.result) });
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {draft.image && (
                <img
                  className="media-upload-preview"
                  src={draft.image}
                  alt="Uploaded product"
                />
              )}
            </div>
          )}
        </section>
        <aside className="editor-aside">
          <div className="panel score-card">
            <div className="eyebrow">LISTING SCORE</div>
            <div className="score-large">
              <strong
                style={{
                  color: score >= 85 ? "var(--green)" : "var(--yellow)",
                }}
              >
                {score}%
              </strong>
              <span className={"status " + (blocking ? "processing" : "ready")}>
                {blocking ? "Needs review" : "Ready to review"}
              </span>
            </div>
            <div className="wide-track">
              <span
                style={{
                  width: score + "%",
                  background: score >= 85 ? "var(--green)" : "var(--yellow)",
                }}
              />
            </div>
            <p>
              {checks.filter((c) => c.passed).length} of {checks.length}{" "}
              prototype checks passed
            </p>
          </div>
          <ValidationErrors checks={checks} />
          <button
            className="btn primary full"
            disabled={blocking || !!busy || saving}
            onClick={async () => {
              if (await save()) setPublishing(true);
            }}
          >
            <Check size={15} />
            {draft.approved ? "Approved · export again" : "Approve & export"}
          </button>
          <button
            className="btn full"
            onClick={() =>
              notify(
                blocking
                  ? "Review the highlighted issues before approval."
                  : "Review complete. No blocking prototype issues found.",
              )
            }
          >
            <RotateCw size={14} />
            Run listing audit
          </button>
          {blocking && (
            <p className="field-hint" style={{ marginTop: 10 }}>
              Resolve the red checks to approve this listing.
            </p>
          )}
        </aside>
      </div>
      {publishing && (
        <PublishSelector
          product={draft}
          onApproved={setDraft}
          onClose={() => setPublishing(false)}
        />
      )}
    </>
  );
}
export default function ListingEditor({
  id,
  review = false,
}: {
  id: string;
  review?: boolean;
}) {
  const { products, ready } = useWorkspace();
  const product = products.find((p) => p.id === id);
  if (!ready) return <div className="loading-state">Loading listing…</div>;
  if (!product)
    return (
      <div className="empty-state">
        <Package size={35} />
        <h2>Product not found</h2>
        <p style={{ margin: "12px 0 20px" }}>
          This product is not in your local workspace.
        </p>
        <Link className="btn primary" href="/dashboard/skus">
          Back to catalog
        </Link>
      </div>
    );
  return <Editor key={id} initial={product} review={review} />;
}
