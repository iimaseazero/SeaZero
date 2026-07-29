'use client';

import { useEffect } from 'react';
import NavBar from './NavBar';
import { useSimStore } from '@/store/useSimStore';

export default function NavBarWrapper() {
  const initFromSavedRoute = useSimStore((s) => s.initFromSavedRoute);

  // Restore an uploaded route on first paint. Without this the route is written
  // to localStorage on upload but never read back, so a custom route silently
  // reverted to Bergen → Kirkenes on every reload. This component renders on
  // every page, so it is the one place that runs regardless of entry point.
  useEffect(() => {
    initFromSavedRoute();
  }, [initFromSavedRoute]);

  return <NavBar />;
}
