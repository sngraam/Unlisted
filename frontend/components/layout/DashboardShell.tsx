"use client";
// Responsive dashboard shell. Individual pages supply only their main content.
import Link from "next/link";
import { useState } from "react";
import { WorkspaceReady, useWorkspace } from "@/lib/stores/workspaceStore";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { products } = useWorkspace();
  const variants = products.reduce((total, product) => total + product.variants.length, 0);
  return (
    <WorkspaceReady>
      <div className={"app-shell " + (collapsed ? "sidebar-collapsed" : "")}>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Sidebar
          open={open}
          onClose={() => setOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
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
            <span>{products.length} products · {variants} variants</span>
            <nav className="footer-links" aria-label="Workspace shortcuts">
              <Link href="/dashboard/skus/new">Create product</Link>
              <Link href="/dashboard/settings/brand">Brand guidelines</Link>
              <Link href="/dashboard/help">Help</Link>
            </nav>
          </footer>
        </div>
      </div>
    </WorkspaceReady>
  );
}
