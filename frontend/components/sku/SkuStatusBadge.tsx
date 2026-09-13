// Status colours are shared between the catalog, overview, and editor.
import { SkuStatus } from "@/types/sku";
export default function SkuStatusBadge({ status }: { status: SkuStatus }) {
  return (
    <span className={"status " + status.toLowerCase()}>
      <span />
      {status}
    </span>
  );
}
