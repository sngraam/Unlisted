import type { Product } from "@/types/sku";

export async function downloadListings(products: Product[], format: "xlsm" | "csv") {
  const response = await fetch("/api/products/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, products: products.map(({ id, updatedAt }) => ({ id, updatedAt })) }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Could not download the listing. Please try again.");
  }
  const filename = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || `Amazon-listings.${format}`;
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
