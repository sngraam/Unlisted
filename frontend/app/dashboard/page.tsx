"use client";
// Workspace overview derives all counts from the current local catalog; no fabricated live metrics.
import Link from "next/link";
import {
  ArrowUpRight,
  Layers3,
  CircleCheck,
  Sparkles,
  CircleAlert,
  ArrowRight,
} from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import SkuStatusBadge from "@/components/sku/SkuStatusBadge";
import MarketplaceBadge from "@/components/ui/MarketplaceBadge";
export default function DashboardPage() {
  const { products, profile, connections, ready } = useWorkspace();
  if (!ready) return <div className="loading-state">Loading workspace…</div>;
  const stats = [
    { label: "Products in workspace", value: products.length, icon: Layers3 },
    {
      label: "Ready for your review",
      value: products.filter((p) => p.status === "Ready").length,
      icon: Sparkles,
    },
    {
      label: "Published samples",
      value: products.filter((p) => p.status === "Published").length,
      icon: CircleCheck,
    },
    {
      label: "Need attention",
      value: products.filter((p) => p.status === "Failed").length,
      icon: CircleAlert,
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow page-kicker">WORKSPACE / OVERVIEW</div>
          <h1>Welcome back, {profile.name.split(" ")[0]}.</h1>
          <p>Here’s what’s happening in {profile.workspace}.</p>
        </div>
        <Link className="btn primary" href="/dashboard/skus">
          View product catalog
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-top">
              {label}
              <Icon size={17} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-foot">Database workspace</div>
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>Your review queue</h2>
            <Link
              className="text-link"
              style={{ fontSize: 12 }}
              href="/dashboard/skus"
            >
              View all
            </Link>
          </div>
          {products
            .filter((p) => ["Ready", "Failed", "Draft"].includes(p.status))
            .slice(0, 6)
            .map((p) => (
              <Link
                className="activity-row"
                href={"/dashboard/skus/" + p.id}
                key={p.id}
              >
                <div>
                  <p>{p.name}</p>
                  <small>
                    {p.sku} · {p.brand}
                  </small>
                </div>
                <SkuStatusBadge status={p.status} />
              </Link>
            ))}
          {!products.some((p) =>
            ["Ready", "Failed", "Draft"].includes(p.status),
          ) && <p className="muted">You’re all caught up.</p>}
        </section>
        <div>
          <section className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-title">
              <h2>Marketplace mix</h2>
              <Layers3 size={16} color="#8088a0" />
            </div>
            {(["Amazon", "Flipkart"] as const).map((m) => {
              const count = products.filter((p) => p.marketplace === m).length;
              return (
                <div className="channel-row" key={m}>
                  <div>
                    <MarketplaceBadge marketplace={m} />
                    <span>{count} products</span>
                  </div>
                  <div className="wide-track">
                    <span
                      style={{
                        width:
                          (products.length
                            ? (count / products.length) * 100
                            : 0) + "%",
                        background: m === "Amazon" ? "#e4ad5f" : "#787dff",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="field-hint">
              {connections.length} marketplace connections configured
            </p>
            <Link
              className="text-link"
              style={{ fontSize: 12 }}
              href="/dashboard/settings"
            >
              Manage connections →
            </Link>
          </section>
          <section className="panel brand-overview">
            <Sparkles size={23} color="#a6a8ff" />
            <h2 style={{ margin: "14px 0 9px" }}>
              A voice that feels like your brand.
            </h2>
            <p className="muted" style={{ fontSize: 12 }}>
              Give your listings a shared voice with brand vocabulary, tone, and
              clear content boundaries.
            </p>
            <Link
              className="text-link"
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontSize: 12,
                marginTop: 19,
              }}
              href="/dashboard/settings/brand"
            >
              Refine brand context
              <ArrowRight size={14} />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
