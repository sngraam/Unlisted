// Product workspace route. ListingEditor owns draft editing and review state.
import ListingEditor from "@/components/listing/ListingEditor";
export default function SkuDetailPage({ params }: { params: { id: string } }) {
  return <ListingEditor id={params.id} />;
}
