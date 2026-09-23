// Server gate: dashboard content is unavailable without a valid PostgreSQL session.
import { redirect } from "next/navigation";
import { currentUser, workspaceAccess } from "@/lib/server/auth";
import DashboardShell from "@/components/layout/DashboardShell";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await currentUser())) redirect("/login");
  const access = await workspaceAccess();
  const isWorkspaceOwner = access.user.id === access.workspace.team.createdById;
  if ((!access.workspace.brandContext || (access.workspace.onboarding && access.workspace.onboarding.status !== "COMPLETED")) && isWorkspaceOwner)
    redirect("/onboarding/profile");
  return <DashboardShell>{children}</DashboardShell>;
}
