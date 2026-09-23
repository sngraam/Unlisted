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
import type { MarketplaceTemplate } from "@/types/marketplace-template";
import { templateGaps, templateFieldDestination, type TemplateFieldFocus } from "@/lib/marketplace-template";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import { auditListing, auditScore } from "@/lib/validation";
import SkuStatusBadge from "@/components/sku/SkuStatusBadge";
import MarketplaceBadge from "@/components/ui/MarketplaceBadge";
import ValidationErrors from "./ValidationErrors";
import PublishSelector from "./PublishSelector";
import VariantEditor from "./VariantEditor";
import AmazonCategoryFields from "./AmazonCategoryFields";
function Editor({ initial, review }: { initial: Product; review: boolean }) {
  const { brand, products, updateProduct, notify, saving, reload } = useWorkspace();
  const [draft, setDraft] = useState<Product>(initial);
  const [tab, setTab] = useState("Listing content");
  const sections = ["Listing content", "Variants & pricing", "Product details", ...(draft.marketplace === "Amazon" ? ["Amazon attributes"] : [])];
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [busy, setBusy] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);
  const [templateError, setTemplateError] = useState("");
  const [attributeVariantId, setAttributeVariantId] = useState(initial.variants[0]?.id || "");
  const [fieldFocus, setFieldFocus] = useState<TemplateFieldFocus | null>(null);
  const [coreFocus, setCoreFocus] = useState<{ section: string; controlId: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const bulletCount = selectedTemplate
    ? Math.max(0, ...selectedTemplate.fields.filter((field) => field.attribute === "bullet_point").map((field) => Number(field.key.match(/#(\d+)/)?.[1] || 1)))
    : Math.max(5, draft.bullets.length);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const checks = auditListing(draft, brand.bannedTerms);
  const score = auditScore(checks);
  const passedChecks = checks.filter((check) => check.passed).length;
  const blocking = checks.some((c) => !c.passed && c.severity === "error");
  const categoryGaps = selectedTemplate && draft.templateId === selectedTemplate.id
    ? templateGaps(draft, selectedTemplate)
    : null;
  const categoryBlocking = !!draft.templateId &&
    (!categoryGaps || categoryGaps.missing.length > 0 || categoryGaps.invalid.length > 0);
  const categoryErrors = categoryGaps ? [...categoryGaps.missing, ...categoryGaps.invalid] : [];
  // A cache refresh must update a pristine editor, while preserving unsaved edits.
  useEffect(() => { if (!dirty) setDraft(initial); }, [initial, dirty]);
  useEffect(() => {
    if (!coreFocus || coreFocus.section !== tab) return;
    const control = document.getElementById(coreFocus.controlId);
    control?.focus({ preventScroll: true });
    control?.scrollIntoView({ block: "center", inline: "nearest" });
  }, [coreFocus, tab]);
  function openTemplateField(variantId: string, key: string) {
    const field = selectedTemplate?.fields.find((item) => item.key === key);
    if (!field) return;
    const destination = templateFieldDestination(field, variantId);
    setTab(destination.section);
    setAttributeVariantId(variantId);
    setCoreFocus(destination.controlId ? destination : null);
    setFieldFocus(destination.section === "Amazon attributes" ? { variantId, key } : null);
  }
  async function refreshSaved() {
    if (dirty && !window.confirm("Discard your unsaved edits and load the saved listing?")) return;
    setRefreshing(true);
    if (await reload()) {
      setDirty(false);
      notify("Latest saved listing loaded.");
    }
    setRefreshing(false);
  }
  // Load the pinned version on page open, even before the attributes tab is visited.
  // Review readiness must never depend on which tab the user happened to open.
  useEffect(() => {
    if (!draft.templateId) {
      setSelectedTemplate(null);
      setTemplateError("");
      return;
    }
    const controller = new AbortController();
    setSelectedTemplate(null);
    setTemplateError("");
    fetch(`/api/marketplace-templates?id=${encodeURIComponent(draft.templateId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Category requirements are unavailable.");
        return response.json() as Promise<{ template: MarketplaceTemplate }>;
      })
      .then(({ template }) => setSelectedTemplate(template))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setTemplateError(error.message);
      });
    return () => controller.abort();
  }, [draft.templateId]);
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
    notify("Listing changes saved.");
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
          { length: bulletCount },
          (_, n) => draft.bullets[n] || "",
        );
        bullets[i] = [
          "From " + draft.brand + ": " + draft.name + ".",
          "Choose your preferred option from the available product variants.",
          "Review the product details to confirm suitability for your needs.",
          "Check the size and specifications before placing your order.",
          "Follow the care instructions supplied with your product.",
        ][i] || "Review this detail against your supplier specifications.";
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
        <div className="actions editor-actions">
          <button className="btn small" onClick={save} disabled={saving}>
            <Save size={14} />
            Save changes
          </button>
          <button
            className="btn primary small"
            disabled={blocking || categoryBlocking || !!busy || saving}
            onClick={async () => {
              if (await save()) setPublishing(true);
            }}
          >
            <Check size={14} />
            {draft.approved ? "Approved · export again" : "Approve & export"}
          </button>
          <button
            className="btn small"
            onClick={() => {
              if (categoryErrors[0]) openTemplateField(categoryErrors[0].variantId, categoryErrors[0].key);
              notify(
                blocking
                  ? "Review the highlighted issues before approval."
                  : categoryBlocking
                    ? "Complete the imported category requirements before approval."
                    : "Review complete. No blocking prototype issues found.",
              );
            }}
          >
            <RotateCw size={14} />
            Run listing audit
          </button>
        </div>
      </div>
      <div className="editor-grid">
        <aside>
          <div
            className="image-score"
            aria-label={`Copy review score ${score} percent; ${passedChecks} of ${checks.length} checks passed`}
          >
            <strong>{score}%</strong>
            <span className="image-score-track" aria-hidden="true">
              <i style={{ width: `${score}%` }} />
            </span>
            <span className="image-score-count">
              {passedChecks}/{checks.length}
            </span>
          </div>
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
            <SkuStatusBadge status={draft.status} approved={draft.approved} />
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
          <ValidationErrors checks={checks} />
          {draft.marketplace === "Amazon" && draft.templateId && (
            <div className={categoryBlocking ? "note category-review-summary" : "note info category-review-summary"}>
              <p>
              {categoryGaps
                ? `${categoryGaps.missing.length} missing and ${categoryGaps.invalid.length} invalid XLSM answers across ${draft.variants.length} SKU(s). This is a template check, not Amazon approval.`
                : templateError || "Loading category requirements…"}
              </p>
              <button type="button" className="btn small" disabled={refreshing || saving} onClick={refreshSaved}>{refreshing ? "Refreshing…" : "Refresh saved data"}</button>
            </div>
          )}
          {categoryErrors.length > 0 && (
            <ul className="category-error-list" aria-label="Category field errors">
              {categoryErrors.map((gap) => <li key={`${gap.variantId}:${gap.key}`}>
                <strong>{gap.sku} · {gap.label}</strong>
                <p>{gap.message}</p>
                <button type="button" className="btn small" aria-label={`Fix ${gap.label} for ${gap.sku}`} onClick={() => openTemplateField(gap.variantId, gap.key)}>Fix field →</button>
              </li>)}
            </ul>
          )}
        </aside>
        <section className="editor-main">
          <div className="editor-heading">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {review ? "FINAL REVIEW" : "YOUR LISTING, REFINED"}
            </div>
            <h1>{review ? "Review every field" : "Listing workspace"}</h1>
            <p>Review content, variant facts and category attributes before approval.</p>
            {draft.workbookExample && <p className="note info">Sample from {draft.workbookExample.sourceFilename} → Data Definitions examples. These can describe unrelated products. Category and demo SKU are retained; {draft.workbookExample.skippedCount} incompatible examples are shown as guidance only.</p>}
          </div>
          <div
            className="editor-tabs"
            style={{
              gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))`,
            }}
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
                onClick={() => { setTab(t); setFieldFocus(null); setCoreFocus(null); }}
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
                  setFieldFocus(null);
                  setCoreFocus(null);
                  event.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                    [next]?.focus();
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="editor-scroll">
          {tab === "Listing content" && (
            <div
              className="panel"
              role="tabpanel"
              id="editor-panel-0"
              aria-labelledby="editor-tab-0"
            >
              <label className="editor-field" style={{ display: "block" }}>
                <span className="field-label">
                  Product title<span>{draft.title.length} characters</span>
                </span>
                <textarea
                  id="listing-title"
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
                  / {bulletCount} fields
                </span>
              </div>
              {Array.from({ length: bulletCount }, (_, i) => (
                <label
                  className="editor-field"
                  style={{ display: "block" }}
                  key={i}
                >
                  <span className="field-label">
                    Bullet point {i + 1}
                    <span>{(draft.bullets[i] || "").length} characters</span>
                  </span>
                  <textarea
                    id={`listing-bullet-${i}`}
                    aria-label={`Bullet point ${i + 1}`}
                    value={draft.bullets[i] || ""}
                    onChange={(e) => {
                      const bullets = Array.from(
                        { length: bulletCount },
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
                  id="listing-description"
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
                template={selectedTemplate}
                onChange={(variants) => patch({ variants })}
                onOpenAmazonField={openTemplateField}
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
                ].map((f) => (
                  <label className="field" key={f.key}>
                    <span className="field-label">{f.label}</span>
                    <input
                      id={`product-${f.key}`}
                      value={String(draft[f.key as keyof Product])}
                      readOnly={f.key === "category" && !!draft.templateId}
                      onChange={(e) => patch({ [f.key]: e.target.value })}
                    />
                  </label>
                ))}
                <label className="field">
                  <span className="field-label">Marketplace</span>
                  <select
                    disabled
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
              <p className="field-hint">Origin, HSN and weight are saved separately for each SKU in Variants & pricing.</p>
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
          {tab === "Amazon attributes" && draft.marketplace === "Amazon" && (
            <div role="tabpanel" id="editor-panel-3" aria-labelledby="editor-tab-3">
              <AmazonCategoryFields
                examplePreview={!!draft.workbookExample}
                locked={!!draft.categoryLocked}
                templateId={draft.templateId}
                productType={draft.productType}
                browseNodeId={draft.browseNodeId}
                variants={draft.variants}
                selectedVariantId={attributeVariantId}
                onVariantChange={(id) => { setAttributeVariantId(id); setFieldFocus(null); }}
                focusRequest={fieldFocus}
                onClearFocus={() => setFieldFocus(null)}
                onChange={(selection) => patch(selection)}
              />
            </div>
          )}
          </div>
        </section>
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
  if (product.status === "Processing")
    return (
      <div className="processing-state panel" role="status">
        <div className="processing-orbit"><Sparkles size={22} /></div>
        <div className="eyebrow">TASK QUEUE · PRODUCT INTAKE</div>
        <h1>We’re preparing your listing</h1>
        <p>
          Your product facts and source files are safely queued. This page is
          locked until extraction, catalog mapping, and validation finish.
        </p>
        <div className="processing-steps">
          <span className="active"><i />Extract product facts</span>
          <span><i />Map marketplace fields</span>
          <span><i />Validate export template</span>
        </div>
        <Link className="btn primary" href="/dashboard/skus">Back to product catalog</Link>
      </div>
    );
  return <Editor key={id} initial={product} review={review} />;
}
