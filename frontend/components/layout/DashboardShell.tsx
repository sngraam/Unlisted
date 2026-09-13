"use client";
// Responsive dashboard shell. Individual pages supply only their main content.
import { useState } from "react";
import { WorkspaceReady } from "@/lib/stores/workspaceStore";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <WorkspaceReady>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div
          className="main-shell"
          ref={(element) => {
            // Update before the drawer's focus effects run, including focus restoration.
            if (element) element.inert = open;
          }}
        >
          <Topbar onMenu={() => setOpen(true)} menuOpen={open} />
          <main className="page-content" id="main-content" tabIndex={-1}>
            {children}
          </main>
          <footer className="app-footer">
            <span>
              AI Listing Agent <span className="muted">/</span> Seller workspace
            </span>
            <span className="local-status">
              <i aria-hidden="true" />
              PostgreSQL · Sample catalog
            </span>
          </footer>
        </div>
      </div>
    </WorkspaceReady>
  );
}
