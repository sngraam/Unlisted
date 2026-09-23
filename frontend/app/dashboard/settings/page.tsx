"use client";
// Database-backed workspace/profile settings. Marketplace connection actions await seller OAuth.
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import SettingsNav from "@/components/layout/SettingsNav";
import WorkspaceSettingsContent from "@/components/settings/WorkspaceSettingsContent";
export default function SettingsPage() {
  const { ready } = useWorkspace();
  if (!ready) return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Workspace settings</h1>
          <p>The people, context, and stores behind your catalog.</p>
        </div>
        <Link className="btn" href="/onboarding/profile">
          Preview onboarding
          <ExternalLink size={14} />
        </Link>
      </div>
      <div className="settings-grid">
        <SettingsNav />
        <div className="settings-content">
          <WorkspaceSettingsContent />
        </div>
      </div>
    </>
  );
}
