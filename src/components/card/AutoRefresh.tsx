'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Keeps the card in sync after staff stamp it at the till: polls a tiny version endpoint and
 * re-renders the page only when the card actually changed.
 */
export function AutoRefresh({ token, intervalMs = 15000 }: { token: string; intervalMs?: number }) {
  const router = useRouter();
  const last = useRef<string | null>(null);
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`/api/customers/${token}/version`, { cache: 'no-store' });
        if (!res.ok) return;
        const { v } = (await res.json()) as { v: string };
        if (last.current !== null && v !== last.current) router.refresh();
        last.current = v;
      } catch {
        /* offline for a moment: try again next tick */
      }
    };
    void tick();
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router, token, intervalMs]);
  return null;
}
