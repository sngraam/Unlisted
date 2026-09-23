// Status colours are shared between the catalog, overview, and editor.
import { SkuStatus } from "@/types/sku";
export default function SkuStatusBadge({ status, approved = false }: { status: SkuStatus; approved?: boolean }) {
  return (
    <span className={"status " + status.toLowerCase()}>
      <span />
      {status === "Ready" ? approved ? "Approved" : "Ready for review" : status}
    </span>
  );
}
