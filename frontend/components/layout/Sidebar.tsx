"use client";
// Main navigation and workspace context. Add future dashboard destinations in the items array.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Layers3,
  Settings2,
  CircleHelp,
  ChevronsUpDown,
  BookOpen,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import SettingsModal from "@/components/settings/SettingsModal";
import { useWorkspace } from "@/lib/stores/workspaceStore";
export default function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const path = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const drawer = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  // Mobile navigation behaves as a dialog; desktop navigation remains a landmark.
  useEffect(() => {
    if (!open) return;
    const previous = document.querySelector<HTMLElement>(
      '[aria-controls="workspace-navigation"]',
    );
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Resolve the visibility change before moving focus out of the inert page.
    drawer.current?.getBoundingClientRect();
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const items = drawer.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not(:disabled)",
      );
      if (!items?.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (!drawer.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const screen = window.matchMedia("(min-width: 769px)");
    const onResize = () => {
      if (screen.matches) close.current();
    };
    document.addEventListener("keydown", onKey);
    screen.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      screen.removeEventListener("change", onResize);
      previous?.focus();
    };
  }, [open]);
  const { profile, products, logout, saving } = useWorkspace();
  const items = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/skus", label: "SKU catalog", icon: Layers3 },
  ];
  return (
    <>
      <div
        className={"sidebar-shade " + (open ? "visible" : "")}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={drawer}
        id="workspace-navigation"
        className={"sidebar " + (open ? "open" : "")}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label="Workspace navigation"
      >
        <div className="sidebar-logo">
          <Logo />
          <button
            className="icon-button sidebar-collapse desktop-only"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
          <button
            className="icon-button mobile-only"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <Link
          href="/dashboard/settings"
          onClick={onClose}
          className="workspace-switch"
        >
          <span className="workspace-avatar">
            {profile.workspace.slice(0, 1)}
          </span>
          <span>
            {profile.workspace}
            <small>{profile.type} workspace</small>
          </span>
          <ChevronsUpDown size={15} />
        </Link>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={
                (href === "/dashboard" ? path === href : path.startsWith(href))
                  ? "page"
                  : undefined
              }
              className={
                "nav-item " +
                ((href === "/dashboard" ? path === href : path.startsWith(href))
                  ? "active"
                  : "")
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} />
              <span className="nav-item-label">{label}</span>
              {label === "SKU catalog" && (
                <span className="nav-counter">{products.length}</span>
              )}
            </Link>
          ))}
          <button
            type="button"
            className={"nav-item " + (path.startsWith("/dashboard/settings") ? "active" : "")}
            onClick={() => {
              onClose();
              setSettingsOpen(true);
            }}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings2 size={18} />
            <span className="nav-item-label">Settings</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <Link
            className="brand-shortcut"
            href="/dashboard/settings/brand"
            onClick={onClose}
          >
            <BookOpen size={17} />
            <span className="sidebar-link-copy">
              Brand guidelines<small>Tone, vocabulary & content rules</small>
            </span>
          </Link>
          <Link
            href="/dashboard/help"
            onClick={onClose}
            className={"nav-item " + (path.includes("/help") ? "active" : "")}
          >
            <CircleHelp size={18} />
            <span className="nav-item-label">Help & getting started</span>
          </Link>
          <div className="user-card">
            <span className="avatar">
              {profile.name
                .split(" ")
                .map((x) => x[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span>
              {profile.name}
              <small>{profile.role ? `${profile.role} · ` : ""}{profile.team}</small>
            </span>
            <button
              className="icon-button"
              disabled={saving}
              onClick={logout}
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
