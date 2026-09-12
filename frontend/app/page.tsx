'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Globe,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Zap,
  ShoppingBag,
  Database
} from 'lucide-react';

interface SystemHealth {
  status: string;
  service: string;
  version: string;
  uptime_seconds: number;
  environment: string;
}

interface Sku {
  id: string;
  sku_code: string;
  name: string;
  brand: string;
  status: string;
  marketplace: string;
}

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [lastCheck, setLastCheck] = useState<string>('');

  const checkBackend = async () => {
    setBackendStatus('loading');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
        setBackendStatus('online');

        // Fetch SKUs sample data
        const skusRes = await fetch(`${apiUrl}/api/v1/skus`);
        if (skusRes.ok) {
          const skusData = await skusRes.json();
          setSkus(skusData);
        }
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      console.error(err);
      setBackendStatus('offline');
    } finally {
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 relative overflow-hidden">
      Hii
    </main>
  );
}
