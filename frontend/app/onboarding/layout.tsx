import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { WorkspaceReady } from "@/lib/stores/workspaceStore";
// Centered onboarding shell, shared by the four setup pages.
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await currentUser())) redirect("/login");
  return (
    <WorkspaceReady>
      <main className="auth-screen">
        {children}
        <div className="auth-bottom">
          <span>AI Listing Agent</span>
          <span>Your next great listing starts here.</span>
        </div>
      </main>
    </WorkspaceReady>
  );
}
