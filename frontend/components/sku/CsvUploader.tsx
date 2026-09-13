"use client";
// Import preview validates the entire file before creating local product drafts.
import { useState } from "react";
import { UploadCloud, FileSpreadsheet, Download } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { parseCsv, downloadText } from "@/lib/csv";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import { Product } from "@/types/sku";
export default function CsvUploader({ onClose }: { onClose: () => void }) {
  const { products, addProducts, notify, saving } = useWorkspace();
  const [preview, setPreview] = useState<Product[]>([]);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  async function read(file?: File) {
    setError("");
    setPreview([]);
    if (!file) return;
    setFilename(file.name);
    if (file.size > 2 * 1024 * 1024) {
      setError("Choose a CSV smaller than 2 MB.");
      return;
    }
    setReading(true);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error("Add at least one product row.");
      if (rows.length > 501)
        throw new Error("Import up to 500 products at a time.");
      const header = rows[0].map((h) => h.trim().toLowerCase());
      for (const name of ["sku", "name", "brand", "marketplace"])
        if (!header.includes(name))
          throw new Error("Missing required column: " + name);
      const seen = new Set(
        products
          .flatMap((p) => [p.sku, ...p.variants.map((v) => v.sku)])
          .map((s) => s.toLowerCase()),
      );
      const imported = rows.slice(1).map((row, i) => {
        const get = (name: string) => row[header.indexOf(name)]?.trim() || "";
        const sku = get("sku");
        if (!sku || !get("name") || !get("brand"))
          throw new Error(
            "Row " + (i + 2) + ": SKU, name and brand are required.",
          );
        if (seen.has(sku.toLowerCase()))
          throw new Error("Duplicate SKU: " + sku);
        seen.add(sku.toLowerCase());
        const channel = get("marketplace").toLowerCase();
        if (!["amazon", "flipkart"].includes(channel))
          throw new Error(
            "Row " + (i + 2) + ": marketplace must be Amazon or Flipkart.",
          );
        const number = (name: string) => {
          const value = Number(get(name) || 0);
          if (!Number.isFinite(value) || value < 0)
            throw new Error("Row " + (i + 2) + ": invalid " + name);
          return value;
        };
        const price = number("price"),
          mrp = number("mrp"),
          stock = number("stock");
        if (price > mrp)
          throw new Error("Row " + (i + 2) + ": price cannot exceed MRP.");
        if (!Number.isInteger(stock))
          throw new Error("Stock must be a whole number.");
        const id = crypto.randomUUID();
        return {
          id,
          sku,
          name: get("name"),
          brand: get("brand"),
          category: get("category") || "Uncategorized",
          marketplace: channel === "amazon" ? "Amazon" : "Flipkart",
          status: "Draft",
          score: 0,
          updatedAt: new Date().toISOString(),
          title: get("name"),
          description: get("description"),
          bullets: [],
          keywords: "",
          rawText: get("description"),
          variants: [
            {
              id: crypto.randomUUID(),
              sku,
              color: get("color") || "Default",
              size: get("size") || "Standard",
              mrp,
              price,
              stock,
            },
          ],
          hsn: "",
          origin: "India",
          weight: 0,
          approved: false,
        } as Product;
      });
      setPreview(imported);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this file.");
    } finally {
      setReading(false);
    }
  }
  return (
    <Modal title="Import your product catalog" onClose={onClose}>
      <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Bring your merchant facts into the workspace. Each row becomes an
        editable product draft.
      </p>
      <label
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          read(e.dataTransfer.files[0]);
        }}
      >
        <UploadCloud size={30} />
        <strong>Choose a CSV or drop it here</strong>
        <p>Up to 500 products · Maximum 2 MB</p>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="Upload product CSV"
          onChange={(e) => read(e.target.files?.[0])}
        />
      </label>
      <button
        className="text-link"
        style={{ display: "flex", gap: 7, marginTop: 15, fontSize: 12 }}
        onClick={() =>
          downloadText(
            "sku,name,brand,marketplace,category,mrp,price,stock,description\nDEMO-001,Cotton Kurta,Anokhi,Amazon,Ethnic Wear,2499,1799,42,Breathable cotton kurta\n",
            "product-import-template.csv",
          )
        }
      >
        <Download size={14} />
        Download sample template
      </button>
      {reading && <p className="field-hint">Reading your file…</p>}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {preview.length > 0 && (
        <div className="note info">
          <FileSpreadsheet size={19} />
          <div>
            <strong>{filename}</strong>
            <br />
            {preview.length} products checked and ready to import.
            <br />
            <span>
              {preview
                .slice(0, 3)
                .map((p) => p.sku)
                .join(", ")}
              {preview.length > 3 ? "…" : ""}
            </span>
          </div>
        </div>
      )}
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn primary"
          disabled={!preview.length || reading || saving}
          onClick={async () => {
            if (!(await addProducts(preview))) return;
            notify(preview.length + " product drafts imported.");
            onClose();
          }}
        >
          Import {preview.length || ""} products
        </button>
      </div>
    </Modal>
  );
}
