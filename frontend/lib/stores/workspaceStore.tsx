"use client";
// Client cache of authenticated PostgreSQL data. Successful server responses replace the cache.
// No product data, passwords or session tokens are written to browser storage.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Product, Marketplace } from "@/types/sku";
export interface BrandContext {
  name: string;
  tone: string;
  glossary: string;
  bannedTerms: string;
  painPoints: string;
}
interface Profile {
  name: string;
  email: string;
  type: string;
  workspace: string;
  team: string;
}
interface WorkspaceState {
  products: Product[];
  brand: BrandContext;
  profile: Profile;
  connections: Marketplace[];
}
const empty: WorkspaceState = {
  products: [],
  brand: { name: "", tone: "", glossary: "", bannedTerms: "", painPoints: "" },
  profile: { name: "", email: "", type: "", workspace: "", team: "" },
  connections: [],
};
interface Store extends WorkspaceState {
  ready: boolean;
  error: string;
  saving: boolean;
  notice: string;
  notify: (message: string) => void;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
  updateProduct: (
    id: string,
    patch: Partial<Product>,
  ) => Promise<Product | undefined>;
  approveProduct: (product: Product) => Promise<Product | undefined>;
  addProducts: (products: Product[]) => Promise<string[] | undefined>;
  setBrand: (brand: BrandContext) => Promise<boolean>;
  setProfile: (profile: Profile) => Promise<boolean>;
}
const Context = createContext<Store | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(empty);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  const pathname = usePathname();
  const protectedPage =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  async function request(path: string, method = "GET", body?: unknown) {
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json();
    if (response.status === 401) {
      setState(empty);
      setReady(false);
      window.location.assign("/login");
    }
    if (!response.ok)
      throw new Error(result.error || "The request could not be completed.");
    return result;
  }
  async function reload() {
    setError("");
    try {
      setState(await request("/api/workspace"));
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load workspace.");
    }
  }
  useEffect(() => {
    if (protectedPage && !ready) void reload();
    if (!protectedPage) {
      setState(empty);
      setReady(false);
    }
  }, [protectedPage]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  async function mutate<T>(action: () => Promise<T>): Promise<T | undefined> {
    setSaving(true);
    try {
      return await action();
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Your changes could not be saved.",
      );
      return undefined;
    } finally {
      setSaving(false);
    }
  }
  const value: Store = {
    ...state,
    ready,
    error,
    saving,
    notice,
    notify: setNotice,
    reload,
    logout: async () => {
      await mutate(async () => {
        await request("/api/auth/logout", "POST");
        setState(empty);
        setReady(false);
        window.location.assign("/login");
      });
    },
    updateProduct: async (id, patch) =>
      mutate(async () => {
        const original = state.products.find((p) => p.id === id);
        if (!original)
          throw new Error("Product not found. Refresh the catalog.");
        const result: WorkspaceState = await request(
          "/api/products/" + id,
          "PUT",
          { ...original, ...patch },
        );
        setState(result);
        return result.products.find((p) => p.id === id);
      }),
    approveProduct: async (product) =>
      mutate(async () => {
        const result: WorkspaceState = await request(
          `/api/products/${product.id}/approve`,
          "POST",
          { updatedAt: product.updatedAt },
        );
        setState(result);
        return result.products.find((p) => p.id === product.id);
      }),
    addProducts: async (products) =>
      mutate(async () => {
        const result = await request("/api/products", "POST", products);
        setState(result.state);
        return result.ids as string[];
      }),
    setBrand: async (brand) =>
      !!(await mutate(async () => {
        setState(await request("/api/workspace", "PATCH", { brand }));
        return true;
      })),
    setProfile: async (profile) =>
      !!(await mutate(async () => {
        setState(await request("/api/workspace", "PATCH", { profile }));
        return true;
      })),
  };
  return (
    <Context.Provider value={value}>
      {children}
      {notice && (
        <div className="toast" role="status">
          <span className="toast-dot" />
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function WorkspaceReady({ children }: { children: ReactNode }) {
  const { ready, error, reload } = useWorkspace();
  if (error)
    return (
      <main className="auth-screen">
        <section className="panel settings-panel" role="alert">
          <h1>Workspace unavailable</h1>
          <p>{error}</p>
          <button className="btn primary" onClick={reload}>
            Try again
          </button>
        </section>
      </main>
    );
  if (!ready)
    return (
      <main className="auth-screen" role="status">
        Loading your workspace…
      </main>
    );
  return <>{children}</>;
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("WorkspaceProvider is required");
  return context;
}
