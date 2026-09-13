// Server gate: dashboard content is unavailable without a valid PostgreSQL session.
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import DashboardShell from "@/components/layout/DashboardShell";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await currentUser())) redirect("/login");
  return <DashboardShell>{children}</DashboardShell>;
}
