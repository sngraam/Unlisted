"use client";
// Variant editing isolates merchant facts from generated listing copy.
import { Plus, Trash2 } from "lucide-react";
import { Variant } from "@/types/sku";
export default function VariantEditor({
  variants,
  onChange,
}: {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}) {
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
                  value={v[f.key as keyof Variant]}
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
