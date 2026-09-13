"use client";
// Product intake creates a parent product plus one or more merchant variants. No AI claims are invented.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  PackagePlus,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import { Marketplace, Variant, Product } from "@/types/sku";
import VariantEditor from "@/components/listing/VariantEditor";
export default function NewSkuPage() {
  const { brand, products, addProducts, notify, saving } = useWorkspace();
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>([
    { id: "new-1", sku: "", color: "", size: "", mrp: 0, price: 0, stock: 0 },
  ]);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const existing = new Set(
      products.flatMap((p) =>
        p.variants.map((v) => v.sku.toLowerCase().trim()),
      ),
    );
    if (
      variants.some(
        (v) => !v.sku.trim() || existing.has(v.sku.toLowerCase().trim()),
      ) ||
      new Set(variants.map((v) => v.sku.trim().toLowerCase())).size !==
        variants.length
    ) {
      setError("Every variant needs a unique seller SKU.");
      return;
    }
    if (
      variants.some(
        (v) =>
          v.price < 0 ||
          v.mrp < v.price ||
          v.stock < 0 ||
          !Number.isInteger(v.stock),
      )
    ) {
      setError(
        "Check your prices and stock: selling price cannot exceed MRP; stock must be a nonnegative whole number.",
      );
      return;
    }
    const name = String(data.get("name")).trim(),
      brandName = String(data.get("brand")).trim();
    if (!name || !brandName) {
      setError("Enter a product name and brand.");
      return;
    }
    const id = crypto.randomUUID();
    const rawText = String(data.get("rawText")).trim();
    const p: Product = {
      id,
      sku: variants[0].sku.trim(),
      name,
      brand: brandName,
      category: String(data.get("category")),
      marketplace: String(data.get("marketplace")) as Marketplace,
      status: "Draft",
      score: 0,
      updatedAt: new Date().toISOString(),
      title: name,
      description: rawText,
      bullets: [],
      keywords: "",
      rawText,
      variants: variants.map((v) => ({ ...v, sku: v.sku.trim() })),
      image,
      hsn: "",
      origin: "India",
      weight: 0,
      approved: false,
    };
    const ids = await addProducts([p]);
    if (!ids) return;
    notify("Product draft created. Add listing content in the workshop.");
    router.push("/dashboard/skus/" + ids[0]);
  }
  return (
    <>
      <Link
        href="/dashboard/skus"
        className="back-link"
        style={{ marginBottom: 20 }}
      >
        <ArrowLeft size={14} />
        Back to catalog
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            FROM PRODUCT TO POSSIBILITY
          </div>
          <h1>Add a new product</h1>
          <p>Start with the facts. Shape the listing in your workshop.</p>
        </div>
      </div>
      <form onSubmit={submit}>
        <div className="new-product-layout">
          <div>
            <section className="panel">
              <div className="section-heading">
                <h2>01 · Product essentials</h2>
                <p>The shared identity for this product and its variants.</p>
              </div>
              <div className="form-grid">
                <label className="field span-two">
                  <span className="field-label">Product name *</span>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Pure Cotton Printed Anarkali Kurta"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Brand *</span>
                  <input name="brand" required defaultValue={brand.name} />
                </label>
                <label className="field">
                  <span className="field-label">Marketplace</span>
                  <select name="marketplace">
                    <option>Amazon</option>
                    <option>Flipkart</option>
                  </select>
                </label>
                <label className="field span-two">
                  <span className="field-label">Category</span>
                  <select name="category">
                    {[
                      "Ethnic Wear > Kurtas",
                      "Ethnic Wear > Sarees",
                      "Apparel > T-Shirts",
                      "Electronics > Audio",
                      "Electronics > Accessories",
                      "Grocery > Spices",
                      "Home > Drinkware",
                      "Other",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
            <section className="panel">
              <div className="section-heading">
                <h2>02 · Product notes & media</h2>
                <p>
                  Paste supplier information, specifications, and verified
                  selling points.
                </p>
              </div>
              <label className="field">
                <span className="field-label">Raw product information</span>
                <textarea
                  name="rawText"
                  rows={6}
                  placeholder="100% cotton, navy blue floral print, Anarkali fit, includes dupatta. Sizes S–XL. Gentle hand wash…"
                />
              </label>
              <label className="dropzone">
                <UploadCloud size={28} />
                <strong>Add a product image</strong>
                <p>JPG, PNG or WebP · Up to 1 MB in this demo</p>
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
                      setError("Choose a JPG, PNG or WebP image under 1 MB.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setImage(String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {image && (
                <img
                  src={image}
                  alt="Product upload preview"
                  className="media-upload-preview"
                />
              )}
            </section>
            <section className="panel">
              <div className="section-heading">
                <h2>03 · Variants & pricing</h2>
                <p>
                  Each sellable option gets its own SKU, price, and inventory.
                </p>
              </div>
              <VariantEditor variants={variants} onChange={setVariants} />
            </section>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <div className="actions" style={{ justifyContent: "flex-end" }}>
              <Link className="btn" href="/dashboard/skus">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="btn primary">
                Create product draft
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <aside className="panel">
            <PackagePlus size={26} color="#9397ff" />
            <h2 style={{ marginTop: 15 }}>
              A little input.
              <br />A better listing.
            </h2>
            <ul className="step-list">
              <li>
                <span>1</span>
                <div>
                  <strong>Capture the facts</strong>Product details stay
                  separate from creative copy.
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Refine your content</strong>Edit titles, benefits, and
                  search terms in the workshop.
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Review, then export</strong>You approve every listing
                  before it leaves the workspace.
                </div>
              </li>
            </ul>
            <div className="note info">
              <Sparkles size={15} />
              <span>
                Your drafts are saved to your workspace in PostgreSQL.
              </span>
            </div>
          </aside>
        </div>
      </form>
    </>
  );
}
