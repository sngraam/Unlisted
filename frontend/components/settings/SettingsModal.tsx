"use client";
// Quick settings dialog mirrors the existing settings pages without changing routes.
import { useState } from "react";
import { BookOpen, CreditCard, Settings2, WalletCards } from "lucide-react";
import BrandContextForm from "@/components/brand/BrandContextForm";
import Modal from "@/components/ui/Modal";
import WorkspaceSettingsContent from "@/components/settings/WorkspaceSettingsContent";

type Tab = "workspace" | "brand" | "wallet";

const tabs: Array<{ id: Tab; label: string; icon: typeof Settings2 }> = [
  { id: "workspace", label: "Workspace & stores", icon: Settings2 },
  { id: "brand", label: "Brand context", icon: BookOpen },
  { id: "wallet", label: "Wallet", icon: WalletCards },
];

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("workspace");

  return (
    <Modal title="Settings" onClose={onClose} className="quick-settings-modal">
      <div className="quick-settings">
        <nav className="quick-settings-nav" aria-label="Settings sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={activeTab === id ? "active" : ""}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="quick-settings-content">
          {activeTab === "workspace" && <WorkspaceSettingsContent />}
          {activeTab === "brand" && (
            <section className="panel settings-panel">
              <div className="section-heading">
                <h2>Brand context</h2>
                <p>Your voice, vocabulary, and listing standards.</p>
              </div>
              <BrandContextForm />
            </section>
          )}
          {activeTab === "wallet" && <WalletContent />}
        </div>
      </div>
    </Modal>
  );
}

function WalletContent() {
  return (
    <section className="panel settings-panel wallet-panel">
      <div className="section-heading">
        <h2>Wallet</h2>
        <p>Manage usage and billing when your account is connected.</p>
      </div>
      <div className="wallet-balance">
        <CreditCard size={20} />
        <div>
          <span>Available balance</span>
          <strong>Not connected</strong>
        </div>
      </div>
      <div className="note info">
        Wallet payments and credits are not configured in this local preview.
      </div>
    </section>
  );
}
