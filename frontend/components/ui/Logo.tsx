// Shared product wordmark. Compact mode is used in onboarding and authentication cards.
import { Sparkles } from "lucide-react";
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <span className="logo-mark">
        <Sparkles size={19} strokeWidth={2} />
      </span>
      <div>AI Listing Agent{!compact && <small>SELLER WORKSPACE</small>}</div>
    </div>
  );
}
