"use client";
// Three-step merchant intake. Submission creates a locked queue item; the
// agent/worker phase can consume ProductIntake without changing this UI contract.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileText, PackagePlus, UploadCloud } from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import { Marketplace, Product, ProductFeatureFact, ProductSourceFile, Variant } from "@/types/sku";
import VariantEditor from "@/components/listing/VariantEditor";
import AmazonCategoryFields from "@/components/listing/AmazonCategoryFields";
import type { MarketplaceTemplate } from "@/types/marketplace-template";

const steps = ["Product details", "Product data", "Marketplace facts"];
const acceptedSource = ["text/markdown", "text/plain", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel.sheet.macroEnabled.12"];

export default function NewSkuPage() {
  const { brand, products, addProducts, notify, saving } = useWorkspace();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [marketplace, setMarketplace] = useState<Marketplace>("Amazon");
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState(brand.name);
  const [category, setCategory] = useState("");
  const [variants, setVariants] = useState<Variant[]>([{ id: "new-1", sku: "", color: "", size: "", mrp: 0, price: 0, stock: 0 }]);
  const [images, setImages] = useState<string[]>([]);
  const [sourceFiles, setSourceFiles] = useState<ProductSourceFile[]>([]);
  const [rawText, setRawText] = useState("");
  const [productIdType, setProductIdType] = useState("GTIN");
  const [materials, setMaterials] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [features, setFeatures] = useState<ProductFeatureFact[]>([{ label: "", value: "" }, { label: "", value: "" }, { label: "", value: "" }]);
  const [amazon, setAmazon] = useState({ templateId: "", productType: "", browseNodeId: "", category: "" });
  const [template, setTemplate] = useState<MarketplaceTemplate | null>(null);
  const [error, setError] = useState("");

  function selectCategory(change: { templateId?: string; productType?: string; browseNodeId?: string; category?: string; variants?: Variant[] }) {
    if (change.variants) setVariants(change.variants);
    setAmazon((current) => ({ ...current,
      ...(change.templateId !== undefined ? { templateId: change.templateId } : {}),
      ...(change.productType !== undefined ? { productType: change.productType } : {}),
      ...(change.browseNodeId !== undefined ? { browseNodeId: change.browseNodeId } : {}),
      ...(change.category !== undefined ? { category: change.category } : {}),
    }));
    if (change.category) setCategory(change.category);
  }
  function validateStep() {
    setError("");
    if (step === 1) {
      if (!name.trim() || !brandName.trim()) return setError("Enter a product name and brand.");
      if (!variants.length || variants.some((variant) => !variant.sku.trim())) return setError("Add a unique seller SKU for every variant.");
      const skus = variants.map((variant) => variant.sku.trim().toLowerCase());
      const existing = new Set(products.flatMap((product) => product.variants.map((variant) => variant.sku.toLowerCase())));
      if (new Set(skus).size !== skus.length || skus.some((sku) => existing.has(sku))) return setError("Every variant needs a unique seller SKU.");
      if (variants.some((variant) => variant.price < 0 || variant.mrp < variant.price || variant.stock < 0 || !Number.isInteger(variant.stock))) return setError("Check price and stock: selling price cannot exceed MRP and stock must be a whole number.");
      if (marketplace === "Amazon" && (!amazon.templateId || !amazon.browseNodeId)) return setError("Select an Amazon product type and browse category.");
    }
    if (step === 3 && features.filter((feature) => feature.label.trim() && feature.value.trim()).length < 3) return setError("Add at least 3 product facts for marketplace validation.");
    return true;
  }
  function readImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).slice(0, 6);
    if (files.some((file) => file.size > 1024 * 1024 || !["image/jpeg", "image/png"].includes(file.type))) return setError("Use JPG or PNG images under 1 MB each.");
    Promise.all(files.map((file) => new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); }))).then(setImages);
  }
  function readSourceFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    const valid = files.filter((file) => acceptedSource.includes(file.type) || /\.(md|txt|csv|xlsm|xlsx)$/i.test(file.name));
    if (valid.length !== files.length || valid.some((file) => file.size > 25 * 1024 * 1024)) return setError("Use .md, .txt, .csv, .xlsm, or .xlsx files under 25 MB.");
    setSourceFiles(valid.map((file) => ({ name: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size })));
    const textFiles = valid.filter((file) => /\.(md|txt|csv)$/i.test(file.name));
    Promise.all(textFiles.map((file) => new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(`\n\n--- ${file.name} ---\n${String(reader.result)}`); reader.readAsText(file); }))).then((contents) => setRawText((current) => current + contents.join("")));
  }
  async function submit() {
    if (!validateStep()) return;
    const product: Product = {
      id: crypto.randomUUID(), sku: variants[0].sku.trim(), name: name.trim(), brand: brandName.trim(), category: marketplace === "Amazon" ? amazon.category : category,
      ...(marketplace === "Amazon" ? { templateId: amazon.templateId, productType: amazon.productType, browseNodeId: amazon.browseNodeId } : {}),
      marketplace, status: "Processing", score: 0, updatedAt: new Date().toISOString(), title: name.trim(), description: "", bullets: [], keywords: "", rawText, images, image: images[0] || "",
      variants: variants.map((variant) => ({ ...variant, sku: variant.sku.trim() })), hsn: "", origin: "", weight: 0, approved: false,
      intake: { productIdType, materials, dimensions, features: features.filter((feature) => feature.label.trim() && feature.value.trim()), sourceFiles, status: "QUEUED", statusMessage: "Waiting for the listing agents to process this product." },
    };
    const ids = await addProducts([product]);
    if (!ids) return;
    notify("Product draft queued. You can review it when processing is complete.");
    router.replace("/dashboard/skus");
  }
  return (
    <>
      <Link href="/dashboard/skus" className="back-link" style={{ marginBottom: 20 }}><ArrowLeft size={14} /> Back to catalog</Link>
      <div className="page-heading"><div><div className="eyebrow" style={{ marginBottom: 9 }}>PRODUCT INTAKE / NEW SKU</div><h1>Add a new product</h1><p>Give the agents verified facts, source files, and the channel you want to prepare for.</p></div></div>
      <div className="intake-progress" aria-label={`Step ${step} of 3`}>{steps.map((label, index) => <button type="button" key={label} className={index + 1 <= step ? "active" : ""} onClick={() => index + 1 < step && setStep(index + 1)}><span>{index + 1 < step ? <Check size={13} /> : index + 1}</span>{label}</button>)}</div>
      <div className="new-product-layout"><div>
        {step === 1 && <>
          <section className="panel"><div className="section-heading"><h2>01 · Product details</h2><p>Start with the identity shared by every sellable variant.</p></div><div className="form-grid"><label className="field span-two"><span className="field-label">Product name *</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Pure Cotton Printed Anarkali Kurta" /></label><label className="field"><span className="field-label">Brand name *</span><input value={brandName} onChange={(event) => setBrandName(event.target.value)} /></label><label className="field"><span className="field-label">Marketplace *</span><select value={marketplace} onChange={(event) => setMarketplace(event.target.value as Marketplace)}><option>Amazon</option><option>Flipkart</option></select></label></div></section>
          {marketplace === "Amazon" ? <AmazonCategoryFields selectionOnly templateId={amazon.templateId} productType={amazon.productType} browseNodeId={amazon.browseNodeId} variants={variants} onChange={selectCategory} onTemplateLoaded={setTemplate} /> : <section className="panel"><label className="field"><span className="field-label">Category *</span><input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Home & Kitchen / Drinkware" /></label></section>}
          <section className="panel"><div className="section-heading"><h2>Images and variants</h2><p>Use JPG or PNG images, then add pricing for each SKU.</p></div><label className="dropzone"><UploadCloud size={24} /><strong>Upload product images</strong><p>JPG or PNG · up to 6 images · 1 MB each</p><input type="file" multiple accept="image/jpeg,image/png" onChange={readImages} /></label>{images.length > 0 && <div className="image-strip">{images.map((image, index) => <img key={image} src={image} alt={`Product image ${index + 1}`} />)}</div>}<div className="section-heading" style={{ marginTop: 25 }}><h2>Variants & pricing</h2><p>Each sellable option gets its own SKU, MRP, price, and inventory.</p></div><VariantEditor variants={variants} onChange={setVariants} template={template} /></section>
        </>}
        {step === 2 && <section className="panel"><div className="section-heading"><h2>02 · Product data</h2><p>Give the extraction agent the raw material it needs. Files stay attached to this intake.</p></div><label className="dropzone"><FileText size={27} /><strong>Upload source files</strong><p>.md, .txt, .csv, .xlsm, or .xlsx · up to 25 MB each</p><input type="file" multiple accept=".md,.txt,.csv,.xlsm,.xlsx,text/markdown,text/plain,text/csv" onChange={readSourceFiles} /></label>{sourceFiles.length > 0 && <ul className="file-list">{sourceFiles.map((file) => <li key={file.name}><FileText size={15} /><span>{file.name}<small>{Math.ceil(file.sizeBytes / 1024)} KB</small></span></li>)}</ul>}<label className="field" style={{ marginTop: 22 }}><span className="field-label">Additional raw product information</span><textarea rows={12} value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Materials, care, packaging, specifications, inclusions, and any supplier notes…" /></label></section>}
        {step === 3 && <section className="panel"><div className="section-heading"><h2>03 · Marketplace facts</h2><p>These facts become structured inputs for category validation. Add 3–4 clear, verifiable facts.</p></div><div className="form-grid"><label className="field"><span className="field-label">Product ID type</span><select value={productIdType} onChange={(event) => setProductIdType(event.target.value)}><option>GTIN</option><option>EAN</option><option>UPC</option><option>ISBN</option><option>GTIN Exempt</option><option>ASIN</option></select></label><label className="field"><span className="field-label">Target channel</span><input value={marketplace} readOnly /></label></div><label className="field"><span className="field-label">Materials</span><textarea rows={3} value={materials} onChange={(event) => setMaterials(event.target.value)} placeholder="100% cotton, stainless steel, ABS…" /></label><label className="field"><span className="field-label">Measurements</span><textarea rows={3} value={dimensions} onChange={(event) => setDimensions(event.target.value)} placeholder="Length × width × height, weight, capacity, size chart…" /></label><div className="fact-list"><div className="field-label">Category-specific facts <small>3–4 required</small></div>{features.map((feature, index) => <div className="fact-row" key={index}><input aria-label={`Fact ${index + 1} name`} placeholder="Fact name" value={feature.label} onChange={(event) => setFeatures((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><input aria-label={`Fact ${index + 1} value`} placeholder="Fact value" value={feature.value} onChange={(event) => setFeatures((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} /></div>)}</div></section>}
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="actions intake-actions"><button type="button" className="btn" onClick={() => step > 1 ? setStep(step - 1) : router.push("/dashboard/skus")}>{step > 1 ? "Back" : "Cancel"}</button>{step < 3 ? <button type="button" className="btn primary" onClick={() => validateStep() && setStep(step + 1)}>Continue <ArrowRight size={15} /></button> : <button type="button" className="btn primary" disabled={saving} onClick={submit}><PackagePlus size={15} /> Create product draft</button>}</div>
      </div><aside className="panel intake-aside"><PackagePlus size={26} color="#9397ff" /><h2 style={{ marginTop: 15 }}>A structured start for better listings.</h2><p className="muted" style={{ marginTop: 10 }}>Your facts, files, images, and marketplace target are stored as one intake record. Agent processing will fill the listing later.</p><ol className="step-list"><li><span>1</span><div><strong>Capture facts</strong>Product identity stays separate from creative copy.</div></li><li><span>2</span><div><strong>Extract source data</strong>Files and notes remain available for validation.</div></li><li><span>3</span><div><strong>Queue the draft</strong>Processing locks the intake until a result is ready.</div></li></ol></aside></div>
    </>
  );
}
