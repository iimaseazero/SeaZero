// Sea Zero — Frozen controls polling hook
// Loads admin-frozen control values on mount and polls every 30 seconds
// so all users see admin changes promptly without full page reload.

import { useEffect } from 'react';
import { useSimStore } from '@/store/useSimStore';

const POLL_INTERVAL_MS = 30_000;

export function useFrozenControls() {
  const loadFrozenControls = useSimStore((s) => s.loadFrozenControls);

  useEffect(() => {
    // Load immediately on mount
    loadFrozenControls();

    // Poll periodically
    const interval = setInterval(loadFrozenControls, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadFrozenControls]);
}
