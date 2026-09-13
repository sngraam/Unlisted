// Consistent marketplace identity. These badges do not indicate a live API connection.
import { Marketplace } from "@/types/sku";
export default function MarketplaceBadge({
  marketplace,
}: {
  marketplace: Marketplace;
}) {
  return (
    <span className="marketplace">
      <span className={"market-icon " + marketplace.toLowerCase()}>
        {marketplace === "Amazon" ? "a" : "F"}
      </span>
      {marketplace}
    </span>
  );
}
