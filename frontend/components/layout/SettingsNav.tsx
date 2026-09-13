"use client";
// Shared settings navigation; separates workspace identity from brand-generation context.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2, BookOpen } from "lucide-react";
export default function SettingsNav() {
  const path = usePathname();
  return (
    <nav className="settings-nav" aria-label="Settings navigation">
      <Link
        className={path === "/dashboard/settings" ? "active" : ""}
        href="/dashboard/settings"
      >
        <Settings2 size={16} />
        Workspace & stores
      </Link>
      <Link
        className={path.endsWith("/brand") ? "active" : ""}
        href="/dashboard/settings/brand"
      >
        <BookOpen size={16} />
        Brand context
      </Link>
    </nav>
  );
}
