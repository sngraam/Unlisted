"use client";
// Review/export dialog. Direct publishing is intentionally unavailable until OAuth/API integration exists.
import { useState } from "react";
import {
  FileSpreadsheet,
  CloudUpload,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import MarketplaceBadge from "@/components/ui/MarketplaceBadge";
import { Product } from "@/types/sku";
import { downloadListings } from "@/lib/listing-export";
import { useWorkspace } from "@/lib/stores/workspaceStore";
export default function PublishSelector({
  product,
  onClose,
  onApproved,
}: {
  product: Product;
  onClose: () => void;
  onApproved: (product: Product) => void;
}) {
  const [route, setRoute] = useState("file");
  const [format, setFormat] = useState<"xlsm" | "csv">("xlsm");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(product.approved);
  const [target, setTarget] = useState(true);
  const { approveProduct, notify, saving } = useWorkspace();
  return (
    <Modal title="Approve & download" onClose={onClose}>
      <p className="muted" style={{ fontSize: 12, marginBottom: 20 }}>
        Choose how to take your reviewed listing to market.
      </p>
      <div className="publish-options">
        <button
          className={"publish-option " + (route === "file" ? "selected" : "")}
          onClick={() => setRoute("file")}
          aria-pressed={route === "file"}
        >
          <FileSpreadsheet size={22} />
          <strong>Amazon template</strong>
          <p>Fill your category’s original Template tab with one row per SKU.</p>
          <span
            className="text-link"
            style={{ fontSize: 11, display: "block", marginTop: 12 }}
          >
            {product.marketplace === "Amazon" ? "Available now" : "Amazon categories only"}
          </span>
        </button>
        <button
          className={"publish-option " + (route === "api" ? "selected" : "")}
          onClick={() => setRoute("api")}
          aria-pressed={route === "api"}
        >
          <CloudUpload size={22} />
          <strong>Direct API push</strong>
          <p>Submit listings through a connected marketplace account.</p>
          <span
            className="muted"
            style={{ fontSize: 11, display: "block", marginTop: 12 }}
          >
            Backend connection needed
          </span>
        </button>
      </div>
      {route === "file" && <label className="field" style={{ marginTop: 20 }}>
        <span className="field-label">Download format</span>
        <select value={format} onChange={(event) => setFormat(event.target.value as "xlsm" | "csv")} disabled={downloading}>
          <option value="xlsm">Excel template (.xlsm) — all tabs and dropdowns</option>
          <option value="csv">Template tab (.csv) — same rows and column order</option>
        </select>
      </label>}
      <div className="eyebrow" style={{ marginTop: 25 }}>
        TARGET MARKETPLACE
      </div>
      <div className="target-options">
        <label className="target-option">
          <MarketplaceBadge marketplace={product.marketplace} />
          <input
            type="checkbox"
            checked={target}
            onChange={(e) => setTarget(e.target.checked)}
            aria-label={"Select " + product.marketplace}
          />
        </label>
      </div>
      <label
        className="check-label"
        style={{ marginTop: 23, alignItems: "flex-start" }}
      >
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />
        <span>I have reviewed the content and verified the product facts.</span>
      </label>
      <div className="note">
        <AlertTriangle size={16} />
        <span>
          {product.marketplace !== "Amazon" ? "Template downloads are currently available for imported Amazon categories."
            : route === "file"
            ? "Your approved values fill row 7 onward. The original headers and example row stay in place. Downloading does not publish the listing."
            : "Live publishing is not connected in this frontend preview. No listing will be sent to a marketplace."}
        </span>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn primary"
          disabled={!approved || !target || route === "api" || saving || downloading || product.marketplace !== "Amazon"}
          onClick={async () => {
            setDownloading(true);
            setError("");
            try {
              const saved = product.approved ? product : await approveProduct(product);
              if (!saved) return;
              onApproved(saved);
              await downloadListings([saved], format);
              notify(`Amazon ${format.toUpperCase()} template downloaded.`);
              onClose();
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : "Download failed. Please try again.");
            } finally { setDownloading(false); }
          }}
        >
          <CheckCircle2 size={15} />
          {downloading ? "Preparing download…" : route === "file" ? "Approve & download" : "API not connected"}
        </button>
      </div>
    </Modal>
  );
}
