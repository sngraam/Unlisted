// Reusable compliance panel. Labels explicitly distinguish prototype checks from marketplace rules.
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { AuditCheck } from "@/lib/validation";
export default function ValidationErrors({ checks }: { checks: AuditCheck[] }) {
  return (
    <section className="panel audit-card">
      <div className="eyebrow">LISTING REVIEW</div>
      {checks.map((c) => (
        <div className="audit-item" key={c.title}>
          {c.passed ? (
            <CheckCircle2 size={14} color="var(--green)" />
          ) : c.severity === "warning" ? (
            <AlertTriangle size={14} color="var(--yellow)" />
          ) : (
            <XCircle size={14} color="var(--red)" />
          )}
          <div>
            <strong>{c.title}</strong>
            <small>{c.detail}</small>
          </div>
        </div>
      ))}
      <p className="field-hint" style={{ marginTop: 18 }}>
        Prototype checks. Marketplace category rules will be added with the
        backend.
      </p>
    </section>
  );
}
