// Dedicated final-review route, using the same editor to avoid diverging listing content.
import ListingEditor from "@/components/listing/ListingEditor";
export default function ReviewPage({ params }: { params: { id: string } }) {
  return <ListingEditor id={params.id} review />;
}
