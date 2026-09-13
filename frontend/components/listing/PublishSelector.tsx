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
import { exportProducts } from "@/lib/csv";
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
  const [route, setRoute] = useState("csv");
  const [approved, setApproved] = useState(product.approved);
  const [target, setTarget] = useState(true);
  const { approveProduct, notify, saving } = useWorkspace();
  return (
    <Modal title="Publish listing" onClose={onClose}>
      <p className="muted" style={{ fontSize: 12, marginBottom: 20 }}>
        Choose how to take your reviewed listing to market.
      </p>
      <div className="publish-options">
        <button
          className={"publish-option " + (route === "csv" ? "selected" : "")}
          onClick={() => setRoute("csv")}
          aria-pressed={route === "csv"}
        >
          <FileSpreadsheet size={22} />
          <strong>Export CSV</strong>
          <p>Download your listing and variant data for a final review.</p>
          <span
            className="text-link"
            style={{ fontSize: 11, display: "block", marginTop: 12 }}
          >
            Available now
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
          {route === "csv"
            ? "This is a review CSV. It is not an official marketplace upload template, and downloading does not publish your product."
            : "Live publishing is not connected in this frontend preview. No listing will be sent to a marketplace."}
        </span>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn primary"
          disabled={!approved || !target || route === "api" || saving}
          onClick={async () => {
            const saved = await approveProduct(product);
            if (!saved) return;
            onApproved(saved);
            exportProducts([saved]);
            notify("Listing approved. Review CSV downloaded.");
            onClose();
          }}
        >
          <CheckCircle2 size={15} />
          {route === "csv" ? "Approve & download" : "API not connected"}
        </button>
      </div>
    </Modal>
  );
}
