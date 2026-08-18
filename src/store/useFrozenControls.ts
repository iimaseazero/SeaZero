// Sea Zero — Frozen controls polling hook
// Loads admin-frozen control values on mount and polls every 30 seconds
// so all users see admin changes promptly without full page reload.

import { useEffect } from 'react';
import { useSimStore } from '@/store/useSimStore';

const POLL_INTERVAL_MS = 30_000;

export function useFrozenControls() {
  const loadFrozenControls = useSimStore((s) => s.loadFrozenControls);
  const initFromSavedConfig = useSimStore((s) => s.initFromSavedConfig);

  useEffect(() => {
    // Load user's saved config first, then apply frozen control locks
    const init = async () => {
      await initFromSavedConfig();
      await loadFrozenControls();
    };
    init();

    // Poll periodically for frozen control updates
    const interval = setInterval(loadFrozenControls, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [initFromSavedConfig, loadFrozenControls]);
}

