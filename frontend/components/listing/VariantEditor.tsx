"use client";
// Variant editing isolates merchant facts from generated listing copy.
import { Plus, Trash2 } from "lucide-react";
import { Variant } from "@/types/sku";
import type { MarketplaceTemplate } from "@/types/marketplace-template";
export default function VariantEditor({
  variants,
  onChange,
  template,
  onOpenAmazonField,
}: {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  template?: MarketplaceTemplate | null;
  onOpenAmazonField?: (variantId: string, key: string) => void;
}) {
  const originField = template?.fields.find((field) => field.attribute === "country_of_origin" && field.key.endsWith("#1.value"));
  const externalInfo = template?.fields.find((field) => field.attribute === "external_product_information" && field.key.endsWith(".value"));
  return (
    <div>
      {variants.map((v, i) => (
        <section className="variant-card" key={v.id}>
          <div className="variant-head">
            <h3>Variant {String(i + 1).padStart(2, "0")}</h3>
            <button
              type="button"
              className="icon-button"
              disabled={variants.length === 1}
              aria-label={"Remove variant " + (i + 1)}
              onClick={() => onChange(variants.filter((x) => x.id !== v.id))}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="form-grid">
            {[
              { key: "sku", label: "Seller SKU", type: "text" },
              { key: "color", label: "Color", type: "text" },
              { key: "size", label: "Size / option", type: "text" },
              { key: "mrp", label: "MRP (₹)", type: "number" },
              { key: "price", label: "Selling price (₹)", type: "number" },
              { key: "stock", label: "Available stock", type: "number" },
            ].map((f) => (
              <label className="field" key={f.key}>
                <span className="field-label">{f.label}</span>
                <input
                  id={`variant-${v.id}-${f.key}`}
                  required={f.key === "sku"}
                  type={f.type}
                  min={f.type === "number" ? 0 : undefined}
                  step={
                    f.key === "stock"
                      ? 1
                      : f.type === "number"
                        ? "0.01"
                        : undefined
                  }
                  value={v[f.key as "sku" | "color" | "size" | "mrp" | "price" | "stock"]}
                  onChange={(e) =>
                    onChange(
                      variants.map((x) =>
                        x.id === v.id
                          ? {
                              ...x,
                              [f.key]:
                                f.type === "number"
                                  ? Number(e.target.value)
                                  : e.target.value,
                            }
                          : x,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <details className="variant-logistics" open>
            <summary>Origin & logistics</summary>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Country of origin {originField?.requirement === "REQUIRED" ? "· Required for approval" : ""}</span>
                {originField?.allowedValues?.length ? (
                  <select id={`variant-${v.id}-countryOfOrigin`} value={v.countryOfOrigin || ""} onChange={(e) => onChange(variants.map((x) => x.id === v.id ? { ...x, countryOfOrigin: e.target.value } : x))}>
                    <option value="">Select origin</option>
                    {originField.allowedValues.map((value) => <option key={value}>{value}</option>)}
                  </select>
                ) : <input id={`variant-${v.id}-countryOfOrigin`} value={v.countryOfOrigin || ""} onChange={(e) => onChange(variants.map((x) => x.id === v.id ? { ...x, countryOfOrigin: e.target.value } : x))} />}
              </label>
              <label className="field">
                <span className="field-label">HSN code</span>
                <input maxLength={16} value={v.hsnCode || ""} onChange={(e) => onChange(variants.map((x) => x.id === v.id ? { ...x, hsnCode: e.target.value } : x))} />
                {externalInfo && <span className="field-hint">Amazon export uses External Product Information in Amazon attributes.</span>}
              </label>
              <label className="field">
                <span className="field-label">Weight (kg)</span>
                <input type="number" min="0" step="0.001" value={v.weightKg ?? ""} placeholder="Not provided" onChange={(e) => onChange(variants.map((x) => x.id === v.id ? { ...x, weightKg: e.target.value === "" ? null : Number(e.target.value) } : x))} />
              </label>
            </div>
            {externalInfo && onOpenAmazonField && <button type="button" className="btn small" onClick={() => onOpenAmazonField(v.id, externalInfo.key)}>Edit Amazon external product information for {v.sku || `variant ${i + 1}`}</button>}
          </details>
          {v.price > v.mrp && (
            <p className="error-text">
              Selling price cannot be higher than MRP.
            </p>
          )}
        </section>
      ))}
      <button
        className="btn small"
        type="button"
        onClick={() =>
          onChange([
            ...variants,
            {
              id: crypto.randomUUID(),
              sku: "",
              color: "",
              size: "",
              mrp: 0,
              price: 0,
              stock: 0,
            },
          ])
        }
      >
        <Plus size={14} />
        Add variant
      </button>
    </div>
  );
}
