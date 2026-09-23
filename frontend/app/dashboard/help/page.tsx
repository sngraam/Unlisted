// Short guide to the actual frontend capabilities and planned backend integrations.
import Link from "next/link";
import { PackagePlus, Sparkles, FileCheck2, ArrowRight } from "lucide-react";
export default function HelpPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            A LITTLE GUIDANCE
          </div>
          <h1>From product facts to a polished listing</h1>
          <p>A simple workflow, with you in control.</p>
        </div>
      </div>
      <div className="help-grid">
        {[
          {
            icon: PackagePlus,
            title: "1. Add your products",
            body: "Create a product and its variants, or import up to 500 rows using the CSV template. Each variant has its own SKU, price, and stock.",
            href: "/dashboard/skus/new",
            link: "Add a product",
          },
          {
            icon: Sparkles,
            title: "2. Refine and review",
            body: "Edit titles, bullet points, descriptions, and keywords. Try sample generation and review the local checks before approving your content.",
            href: "/dashboard/skus",
            link: "Open the catalog",
          },
          {
            icon: FileCheck2,
            title: "3. Approve and export",
            body: "Confirm your product facts, then download the filled Amazon category template as XLSM or CSV. Each SKU has its own row. Direct publishing is not connected yet.",
            href: "/dashboard/settings",
            link: "View marketplace settings",
          },
        ].map(({ icon: Icon, title, body, href, link }) => (
          <section className="panel" key={title}>
            <div className="help-step">
              <Icon size={20} />
            </div>
            <h2>{title}</h2>
            <p>{body}</p>
            <Link
              className="text-link"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
              }}
              href={href}
            >
              {link}
              <ArrowRight size={14} />
            </Link>
          </section>
        ))}
      </div>
      <section className="panel" style={{ marginTop: 25, maxWidth: 850 }}>
        <h2>About this preview</h2>
        <p className="muted" style={{ marginTop: 12 }}>
          Sign-in and catalog saves use local PostgreSQL. The initial catalog contains synthetic sample data, including historical display statuses. Sample generation uses templates; marketplace publishing is not connected.
        </p>
        <p className="muted" style={{ marginTop: 12 }}>
          Product facts, variants, listing revisions, brand settings, and review approvals are persisted. Official marketplace validation and seller OAuth are still being built.
        </p>
        <Link
          className="text-link"
          href="/login"
          style={{ display: "inline-block", marginTop: 18 }}
        >
          Preview the sign-in experience →
        </Link>
      </section>
    </>
  );
}
