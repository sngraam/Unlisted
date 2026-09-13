// Default entry point opens the catalog so the frontend can be explored immediately.
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/dashboard/skus");
}
