"use client";
// Template-driven Amazon field editor. Exact answers stay on each SKU and round-trip via MarketplacePayload.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import type { Variant } from "@/types/sku";
import type { MarketplaceTemplate, MarketplaceTemplateField, MarketplaceTemplateSummary } from "@/types/marketplace-template";
import { isManagedTemplateField, templateDefinitions, templateAnswerIssues, relatedTemplateFieldKeys, templateFieldSearchText, type TemplateDefinition, type TemplateFieldFocus } from "@/lib/marketplace-template";
import TemplateDefinitionEditor from "./TemplateDefinitionEditor";

interface Selection {
  templateId?: string;
  productType?: string;
  browseNodeId?: string;
  category?: string;
  variants?: Variant[];
}

interface CategorySection {
  title: string;
  description: string;
  groups: readonly string[];
}

const categorySections: readonly CategorySection[] = [
  {
    title: "Product Identity",
    description: "Identify the product and its variation relationship.",
    groups: ["Listing Identity", "Variations", "Product Identity"],
  },
  {
    title: "Images",
    description: "Add product image URLs and related media details.",
    groups: ["Images"],
  },
  {
    title: "Product Details",
    description: "Describe materials, measurements, features, and category-specific facts.",
    groups: ["Product Details"],
  },
  {
    title: "Offer & Pricing",
    description: "Set availability, price, tax, and other offer information.",
    groups: ["Offer", "Offer (IN) - (Sell on Amazon)"],
  },
  {
    title: "Shipping",
    description: "Provide package, fulfilment, and delivery-related information.",
    groups: ["Shipping"],
  },
  {
    title: "Safety & Compliance",
    description: "Add applicable safety, regulatory, and compliance details.",
    groups: ["Safety & Compliance"],
  },
] as const;

function sectionForGroup(group: string) {
  return categorySections.find((section) => section.groups.includes(group))?.title || "Product Details";
}

export default function AmazonCategoryFields({
  templateId,
  productType,
  browseNodeId,
  variants,
  onChange,
  onTemplateLoaded,
  locked = false,
  selectionOnly = false,
  examplePreview = false,
  selectedVariantId,
  onVariantChange,
  focusRequest,
  onClearFocus,
}: {
  templateId?: string;
  productType?: string;
  browseNodeId?: string;
  variants: Variant[];
  onChange: (selection: Selection) => void;
  onTemplateLoaded?: (template: MarketplaceTemplate | null) => void;
  locked?: boolean;
  selectionOnly?: boolean;
  examplePreview?: boolean;
  selectedVariantId?: string;
  onVariantChange?: (id: string) => void;
  focusRequest?: TemplateFieldFocus | null;
  onClearFocus?: () => void;
}) {
  const [summaries, setSummaries] = useState<MarketplaceTemplateSummary[]>([]);
  const [loadedTemplate, setTemplate] = useState<MarketplaceTemplate | null>(null);
  // Never display the previous category while the newly selected version loads.
  const template = loadedTemplate?.id === templateId ? loadedTemplate : null;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id || "");
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<string[]>([]);
  const handledFocus = useRef<TemplateFieldFocus | null>(null);
  const [revealedRequest, setRevealedRequest] = useState<TemplateFieldFocus | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/marketplace-templates", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load category templates.");
        return response.json();
      })
      .then((data) => { if (alive) setSummaries(data.templates); })
      .catch((cause) => { if (alive) setError(cause.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    setShowAll(examplePreview);
    setSearch("");
    if (!templateId) { setTemplate(null); onTemplateLoaded?.(null); return; }
    let alive = true;
    setTemplate(null);
    onTemplateLoaded?.(null);
    setError("");
    fetch(`/api/marketplace-templates?id=${encodeURIComponent(templateId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Selected category template is unavailable.");
        return response.json() as Promise<{ template: MarketplaceTemplate }>;
      })
      .then(({ template: selected }) => {
        if (selected.id !== templateId) throw new Error("Selected category template does not match.");
        if (alive) { setTemplate(selected); onTemplateLoaded?.(selected); }
      })
      .catch((cause) => { if (alive) setError(cause.message); });
    return () => { alive = false; };
  }, [templateId, examplePreview]);
  useEffect(() => {
    if (!variants.some((variant) => variant.id === selectedVariant))
      setSelectedVariant(variants[0]?.id || "");
  }, [variants, selectedVariant]);

  const activeVariant = variants.find((variant) => variant.id === (selectedVariantId || selectedVariant)) || variants[0];
  const definitions = useMemo(() => template ? templateDefinitions(template) : [], [template]);
  const editable = useMemo(() => definitions.filter((definition) => definition.cells.some((cell) => !isManagedTemplateField(cell))), [definitions]);
  const managed = useMemo(() => definitions.filter((definition) => definition.cells.every(isManagedTemplateField)), [definitions]);
  const answerIssues = useMemo(() => template && activeVariant ? templateAnswerIssues(template, activeVariant.channelAttributes || {}) : [], [template, activeVariant]);
  const revealKeys = useMemo(() => template && focusRequest?.variantId === activeVariant?.id
    ? relatedTemplateFieldKeys(template, focusRequest.key) : [], [template, focusRequest, activeVariant?.id]);
  useEffect(() => {
    if (!template || !focusRequest || focusRequest.variantId !== activeVariant?.id) return;
    setSearch("");
    setRevealedRequest(focusRequest);
  }, [template, focusRequest, activeVariant?.id]);
  const visible = useMemo(() => editable.filter((definition) => {
    const field = definition.field;
    const filled = definition.cells.some((cell) => !isManagedTemplateField(cell) && !!activeVariant?.channelAttributes?.[cell.key]?.trim());
    const essential = field.requirement === "REQUIRED" || filled || definition.cells.some((cell) => revealKeys.includes(cell.key) || answerIssues.some((issue) => issue.key === cell.key));
    const matches = !search.trim() || templateFieldSearchText(definition).includes(search.trim().toLowerCase());
    if (revealKeys.length) return definition.cells.some((cell) => revealKeys.includes(cell.key));
    return matches && (showAll || !!search || essential);
  }), [editable, activeVariant, answerIssues, revealKeys, search, showAll]);
  useEffect(() => {
    if (!template || !focusRequest || revealedRequest !== focusRequest || handledFocus.current === focusRequest || activeVariant?.id !== focusRequest.variantId) return;
    const field = template.fields.find((item) => item.key === focusRequest.key);
    const control = field && document.getElementById(`cell-${template.id}-${field.column}`);
    if (!control) return;
    control.focus({ preventScroll: true });
    control.scrollIntoView({ block: "center", inline: "nearest" });
    handledFocus.current = focusRequest;
  }, [template, focusRequest, revealedRequest, activeVariant?.id, visible]);
  const sectionGroups = useMemo(() => categorySections.map((section) => ({
    ...section,
    fields: visible.filter((definition) => sectionForGroup(definition.field.group) === section.title),
    total: editable.filter((definition) => sectionForGroup(definition.field.group) === section.title).length,
  })), [editable, visible]);
  useEffect(() => {
    if (!search.trim() && !revealKeys.length) return;
    const matchingSections = sectionGroups
      .filter((section) => section.fields.length)
      .map((section) => section.title);
    if (!matchingSections.length) return;
    setOpenSections((current) => Array.from(new Set([...current, ...matchingSections])));
  }, [search, revealKeys, sectionGroups]);
  const missing = editable.filter((definition) =>
    definition.field.requirement === "REQUIRED" && !definition.cells.some((cell) => isManagedTemplateField(cell) || !!activeVariant?.channelAttributes?.[cell.key]?.trim()),
  ).length;

  function setAnswer(field: MarketplaceTemplateField, value: string) {
    if (!activeVariant) return;
    onChange({
      variants: variants.map((variant) => variant.id === activeVariant.id
        ? {
            ...variant,
            channelAttributes: {
              ...(variant.channelAttributes || {}),
              [field.key]: value,
            },
          }
        : variant),
    });
  }

  return (
    <section className="amazon-fields">
      <div className="panel amazon-category-selector">
        {selectionOnly && (
          <div className="section-heading">
            <h2>Choose your product category</h2>
            <p>Choose the category once. All variants will use the same category.</p>
          </div>
        )}
        {!selectionOnly && (
          <p className="category-selector-status">
            {locked ? "Category is locked for this product." : "Product category applies to all variants."}
          </p>
        )}
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Product type *</span>
            <select
              value={templateId || ""}
              required
              disabled={loading || locked}
              onChange={(event) => {
                const next = summaries.find((item) => item.id === event.target.value);
                setShowAll(false);
                setSearch("");
                onChange({
                  templateId: next?.id || "",
                  productType: next?.productType || "",
                  browseNodeId: "",
                  category: "",
                  variants: variants.map((variant) => ({ ...variant, channelAttributes: {} })),
                });
              }}
            >
              <option value="">Select a product type</option>
              {summaries.map((item) => <option key={item.id} value={item.id}>{item.productType}</option>)}
              {templateId && !summaries.some((item) => item.id === templateId) &&
                <option value={templateId}>{productType} · saved version</option>}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Browse category *</span>
            <select
              value={browseNodeId || ""}
              required
              disabled={!template || locked}
              onChange={(event) => {
                const node = template?.browseNodes.find((item) => item.id === event.target.value);
                onChange({ browseNodeId: node?.id || "", category: node?.path || "" });
              }}
            >
              <option value="">Choose the closest category</option>
              {template?.browseNodes.map((item) => <option key={item.id} value={item.id}>{item.path}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
        {!loading && summaries.length === 0 && !error &&
          <p className="note info">No Amazon templates are imported yet. Add an XLSM using the admin import command.</p>}
        {templateId && !template && !error && <p className="muted" role="status">Loading selected category…</p>}
      </div>
      {!selectionOnly && template && activeVariant && (
        <>
          <div className="template-meta">
            <span>{template.productType} · {definitions.length} field definitions</span>
            <span>{revealKeys.length ? "Selected field + related fields" : search ? "Search results" : showAll ? "All category fields" : "Required + filled fields"}</span>
          </div>
          <div className="template-toolbar">
            {variants.length > 1 && (
              <label className="field">
                <span className="field-label">Editing SKU</span>
                <select value={activeVariant.id} onChange={(event) => {
                  setSelectedVariant(event.target.value);
                  onVariantChange?.(event.target.value);
                }}>
                  {variants.map((variant, index) => <option key={variant.id} value={variant.id}>{variant.sku || `Variant ${index + 1}`}</option>)}
                </select>
              </label>
            )}
            <label className="catalog-search template-search">
              <Search size={15} />
              <input aria-label="Search category attributes" placeholder={`Search ${template.productType} attributes…`} value={search} onChange={(event) => { onClearFocus?.(); setSearch(event.target.value); }} />
            </label>
            <button type="button" className="btn small" aria-pressed={!revealKeys.length && showAll} onClick={() => { setShowAll(revealKeys.length ? true : !showAll); onClearFocus?.(); }}>
              <SlidersHorizontal size={14} /> {showAll && !revealKeys.length ? "Show required + filled" : `Show all ${template.productType} fields (${editable.length})`}
            </button>
          </div>
          <p className="template-editing" role="status">Editing <strong>{activeVariant.sku}</strong>{focusRequest?.variantId === activeVariant.id && ` · ${template.fields.find((field) => field.key === focusRequest.key)?.label || "Selected field"}`}</p>
          <p className="field-hint">{visible.length} of {editable.length} category fields shown · {managed.length} fields in other sections. Repeated values stay inside one field.</p>
          <details className="field-help template-overview">
            <summary>Data Definitions overview &amp; common fields</summary>
            <p>{["REQUIRED", "CONDITIONAL", "RECOMMENDED", "OPTIONAL"].map((requirement) => `${definitions.filter((d) => d.field.requirement === requirement).length} ${requirement.toLowerCase()}`).join(" · ")}</p>
            <p>The workbook has {template.fieldCount} export columns, including repeated values. Examples illustrate input format and may describe other products.</p>
            <dl>{managed.map((definition) => <div key={definition.pattern}><dt>{definition.field.label}</dt><dd>{definition.example || "Edited in the product or SKU sections."}</dd></div>)}</dl>
          </details>
          <p className="template-guidance">
            {missing ? `${missing} required template ${missing === 1 ? "answer" : "answers"} missing for this SKU.` : "Required editable answers entered for this SKU."}
            {" "}Conditional fields may become required based on variation, product and seller context.
          </p>
          <p className="template-accordion-intro">Choose a section to expand its category fields.</p>
          <div className="template-accordion-list">
            {sectionGroups.map((section) => {
              const isOpen = openSections.includes(section.title);
              const required = section.fields.filter((definition) => definition.field.requirement === "REQUIRED").length;
              return (
                <details
                  className="template-accordion"
                  key={section.title}
                  open={isOpen}
                  onToggle={(event) => {
                    const isNowOpen = event.currentTarget.open;
                    setOpenSections((current) => isNowOpen
                      ? Array.from(new Set([...current, section.title]))
                      : current.filter((title) => title !== section.title));
                  }}
                >
                  <summary>
                    <span className="template-accordion-copy">
                      <strong>{section.title}</strong>
                      <small>{section.description}</small>
                    </span>
                    <span className="template-accordion-meta">
                      <span>{section.fields.length} of {section.total} shown</span>
                      {required > 0 && <em>{required} required</em>}
                      <ChevronDown size={18} aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="template-accordion-body">
                    {section.fields.length ? (
                      <div className="template-field-grid">
                        {section.fields.map((definition) => (
                          <TemplateDefinitionEditor
                            key={`${template.id}:${activeVariant.id}:${definition.pattern}`}
                            definition={definition}
                            template={template}
                            answers={activeVariant.channelAttributes || {}}
                            issues={answerIssues}
                            revealKeys={revealKeys}
                            onChange={setAnswer}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="template-accordion-empty">
                        {search.trim() ? "No attributes in this section match your search." : "No required or completed attributes are shown here yet. Use Show all to review every field."}
                      </p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
          <p className="field-hint">Brand, SKU, title, bullets and country of origin are in the product and variant sections. Amazon may request additional information during submission.</p>
        </>
      )}
    </section>
  );
}
