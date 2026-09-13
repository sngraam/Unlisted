"use client";
// Catalog working surface: search, status/channel/date filters, selection, pagination, and CSV actions.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Upload,
  Search,
  Layers3,
  CircleCheck,
  Sparkles,
  Clock3,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  X,
  Download,
  Package,
  Shirt,
  Headphones,
  ShoppingBag,
} from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspaceStore";
import SkuStatusBadge from "./SkuStatusBadge";
import MarketplaceBadge from "@/components/ui/MarketplaceBadge";
import CsvUploader from "./CsvUploader";
import { exportProducts } from "@/lib/csv";
export function Score({ value }: { value: number }) {
  const color =
    value >= 90 ? "var(--green)" : value >= 70 ? "var(--yellow)" : "var(--red)";
  return (
    <span className="score" style={{ color }}>
      <span className="score-track">
        <span style={{ width: value + "%", background: color }} />
      </span>
      {value}%
    </span>
  );
}
export default function Catalog() {
  const { products, ready, notify } = useWorkspace();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [tab, setTab] = useState("All products");
  const [channel, setChannel] = useState("All channels");
  const [status, setStatus] = useState("All statuses");
  const [date, setDate] = useState("Any time");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [upload, setUpload] = useState(false);
  useEffect(() => {
    setQuery(params.get("q") || "");
  }, [params]);
  useEffect(() => setPage(1), [query, tab, channel, status, date]);
  const tabs = [
    "All products",
    "Ready for review",
    "Published",
    "Needs attention",
  ];
  const filtered = products.filter(
    (p) =>
      [p.sku, p.name, p.brand].some((v) =>
        v.toLowerCase().includes(query.toLowerCase()),
      ) &&
      (channel === "All channels" || p.marketplace === channel) &&
      (status === "All statuses" || p.status === status) &&
      (tab === "All products" ||
        (tab === "Ready for review" && p.status === "Ready") ||
        (tab === "Published" && p.status === "Published") ||
        (tab === "Needs attention" && p.status === "Failed")) &&
      (date === "Any time" ||
        Date.now() - new Date(p.updatedAt).getTime() < Number(date) * 86400000),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * 10, current * 10);
  const allSelected =
    visible.length > 0 && visible.every((p) => selected.includes(p.id));
  const toggleVisible = () =>
    setSelected(
      allSelected
        ? selected.filter((id) => !visible.some((p) => p.id === id))
        : Array.from(new Set([...selected, ...visible.map((p) => p.id)])),
    );
  const stats = [
    {
      label: "Total products",
      value: products.length,
      icon: Layers3,
      foot: "Across your workspace",
      view: "All products",
    },
    {
      label: "Published listings",
      value: products.filter((p) => p.status === "Published").length,
      icon: CircleCheck,
      foot: "Sample marketplace listings",
      view: "Published",
    },
    {
      label: "Ready for review",
      value: products.filter((p) => p.status === "Ready").length,
      icon: Sparkles,
      foot: "Waiting for your approval",
      view: "Ready for review",
    },
    {
      label: "In progress",
      value: products.filter((p) => p.status === "Processing").length,
      icon: Clock3,
      foot: "Sample generation jobs",
      view: "Processing",
    },
  ];
  if (!ready)
    return <div className="loading-state">Loading your workspace…</div>;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow page-kicker">CATALOG / PRODUCTS</div>
          <h1>Product catalog</h1>
          <p>Your products, organized. Your next listing, a little closer.</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setUpload(true)}>
            <Upload size={15} />
            Upload CSV
          </button>
          <Link href="/dashboard/skus/new" className="btn primary">
            <Plus size={16} />
            Add new SKU
          </Link>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, foot, view }) => (
          <button
            className="stat-card stat-shortcut"
            key={label}
            onClick={() => {
              setTab(view === "Processing" ? "All products" : view);
              setStatus(view === "Processing" ? "Processing" : "All statuses");
              setQuery("");
              setChannel("All channels");
              setDate("Any time");
            }}
            aria-label={`Show ${label.toLowerCase()}: ${value}`}
          >
            <div className="stat-top">
              {label}
              <Icon size={16} />
            </div>
            <div className="stat-value">
              {value}
              <ArrowUpRight size={16} className="stat-arrow" />
            </div>
            <div className="stat-foot">{foot}</div>
          </button>
        ))}
      </div>
      <section className="catalog-panel" aria-label="Product catalog">
        <div className="catalog-tabs">
          <div className="tab-list" role="group" aria-label="Catalog views">
            {tabs.map((t) => (
              <button
                aria-pressed={tab === t}
                className={"tab-button " + (t === tab ? "active" : "")}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "All products" && (
                  <span className="tab-count">{products.length}</span>
                )}
                {t === "Needs attention" && (
                  <span className="tab-count">
                    {products.filter((p) => p.status === "Failed").length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="catalog-total">{products.length} total</span>
        </div>
        <div className="catalog-tools">
          <div className="catalog-search">
            <Search size={15} />
            <input
              aria-label="Search products"
              placeholder="Search products or SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            aria-label="Filter marketplace"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            {["All channels", "Amazon", "Flipkart"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            className="filter-select"
            aria-label="Filter status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              "All statuses",
              "Draft",
              "Processing",
              "Ready",
              "Published",
              "Failed",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            className="filter-select"
            aria-label="Filter date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          >
            <option>Any time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <span className="result-count" role="status">
            {filtered.length} results
          </span>
          {(query ||
            channel !== "All channels" ||
            status !== "All statuses" ||
            date !== "Any time" ||
            tab !== "All products") && (
            <button
              className="filter-reset"
              onClick={() => {
                setQuery("");
                setTab("All products");
                setStatus("All statuses");
                setChannel("All channels");
                setDate("Any time");
              }}
            >
              <X size={13} />
              Reset
            </button>
          )}
        </div>
        <label className="mobile-select-all">
          <input
            type="checkbox"
            aria-label="Select visible products"
            checked={allSelected}
            onChange={toggleVisible}
          />
          Select this page
        </label>
        {selected.length > 0 && (
          <div className="catalog-tools">
            <span className="muted">{selected.length} selected</span>
            <button
              className="btn small"
              onClick={() => {
                exportProducts(products.filter((p) => selected.includes(p.id)));
                notify("Review CSV downloaded.");
              }}
            >
              <Download size={13} />
              Export selected
            </button>
            <button className="text-link" onClick={() => setSelected([])}>
              Clear
            </button>
          </div>
        )}
        <div className="table-scroll">
          <table className="catalog-table" role="table" aria-label="Products">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select visible products"
                    checked={allSelected}
                    onChange={toggleVisible}
                  />
                </th>
                <th>PRODUCT</th>
                <th>MARKETPLACE</th>
                <th>STATUS</th>
                <th>LISTING SCORE</th>
                <th>UPDATED</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => {
                const Icon = p.category.includes("Ethnic")
                  ? Shirt
                  : p.category.includes("Electronics")
                    ? Headphones
                    : p.category.includes("Grocery")
                      ? ShoppingBag
                      : Package;
                return (
                  <tr
                    key={p.id}
                    className={selected.includes(p.id) ? "selected" : ""}
                    role="row"
                  >
                    <td className="cell-select" role="cell">
                      <input
                        aria-label={"Select " + p.sku}
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() =>
                          setSelected(
                            selected.includes(p.id)
                              ? selected.filter((id) => id !== p.id)
                              : [...selected, p.id],
                          )
                        }
                      />
                    </td>
                    <td className="cell-product" role="cell">
                      <Link
                        className="product-cell"
                        href={"/dashboard/skus/" + p.id}
                      >
                        <span className={"product-icon hue" + (i % 4)}>
                          <Icon size={20} />
                        </span>
                        <div>
                          <div className="product-title" title={p.name}>
                            {p.name}
                          </div>
                          <small>
                            <span className="sku-code">{p.sku}</span>{" "}
                            <span style={{ padding: "0 5px" }}>·</span>{" "}
                            {p.variants.length} variant
                            {p.variants.length !== 1 ? "s" : ""}
                          </small>
                        </div>
                      </Link>
                    </td>
                    <td
                      className="cell-marketplace"
                      data-label="Channel"
                      role="cell"
                    >
                      <MarketplaceBadge marketplace={p.marketplace} />
                    </td>
                    <td className="cell-status" data-label="Status" role="cell">
                      <SkuStatusBadge status={p.status} />
                    </td>
                    <td
                      className="cell-score"
                      data-label="Listing score"
                      role="cell"
                    >
                      <Score value={p.score} />
                    </td>
                    <td
                      className="cell-updated"
                      data-label="Updated"
                      role="cell"
                    >
                      {new Date(p.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="cell-action" role="cell">
                      <Link
                        href={"/dashboard/skus/" + p.id}
                        className="icon-button"
                        aria-label={"Edit " + p.name}
                      >
                        <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!visible.length && (
          <div className="empty-state">
            <Package size={34} />
            <h3>No products found</h3>
            <p>Try another search or clear your filters.</p>
            <button
              className="btn small"
              style={{ marginTop: 18 }}
              onClick={() => {
                setQuery("");
                setTab("All products");
                setStatus("All statuses");
                setChannel("All channels");
                setDate("Any time");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        <div className="table-footer">
          <span>
            Showing {filtered.length ? (current - 1) * 10 + 1 : 0}–
            {Math.min(current * 10, filtered.length)} of {filtered.length}{" "}
            products
          </span>
          <div className="pagination">
            <button
              disabled={current === 1}
              aria-label="Previous page"
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - current) < 3)
              .map((n) => (
                <button
                  key={n}
                  className={n === current ? "active" : ""}
                  aria-label={"Page " + n}
                  aria-current={n === current ? "page" : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            <button
              disabled={current === pageCount}
              aria-label="Next page"
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
      <div className="catalog-note">
        <Sparkles size={13} />
        <span>
          Made for your next <em>ready-to-review</em> listing. Sample data stays
          in PostgreSQL.
        </span>
      </div>
      {upload && <CsvUploader onClose={() => setUpload(false)} />}
    </>
  );
}
