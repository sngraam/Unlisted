"use client";
// Page breadcrumb, global catalog search, and demo notifications.
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, Search, ChevronRight } from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspaceStore";
export default function Topbar({
  onMenu,
  menuOpen,
}: {
  onMenu: () => void;
  menuOpen: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { notify, profile } = useWorkspace();
  const title = path.includes("/skus/new")
    ? "New product"
    : path.includes("/skus/")
      ? "Listing workspace"
      : path.includes("/skus")
        ? "SKU catalog"
        : path.includes("/settings")
          ? "Settings"
          : path.includes("/help")
            ? "Help"
            : "Overview";
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          className="icon-button mobile-only"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          aria-controls="workspace-navigation"
          onClick={onMenu}
        >
          <Menu size={20} />
        </button>
        <span>{profile.workspace}</span>
        <ChevronRight size={14} />
        <strong>{title}</strong>
      </div>
      <div className="topbar-actions">
        <span className="demo-label">Sample catalog</span>
        <form
          className="global-search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/dashboard/skus?q=" + encodeURIComponent(query));
          }}
        >
          <Search size={15} />
          <input
            aria-label="Search catalog"
            placeholder="Search SKU, product…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>↵</kbd>
        </form>
        <button
          className="icon-button notification-button"
          aria-label="Notifications"
          onClick={() =>
            notify(
              "You’re up to date. Review ready listings in your SKU catalog.",
            )
          }
        >
          <Bell size={18} />
        </button>
        <span className="avatar small">
          {profile.name
            .split(" ")
            .map((x) => x[0])
            .join("")
            .slice(0, 2)}
        </span>
      </div>
    </header>
  );
}
