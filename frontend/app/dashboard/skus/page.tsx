// SKU catalog route. Suspense contains client-side search parameters during production rendering.
import { Suspense } from "react";
import Catalog from "@/components/sku/Catalog";
export default function SkuListPage() {
  return (
    <Suspense fallback={<div className="loading-state">Loading catalog…</div>}>
      <Catalog />
    </Suspense>
  );
}
