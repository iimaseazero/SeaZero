'use client';

// Sea Zero — React bindings for the localStorage-backed collections.
//
// These used to be read with `setState` inside an effect, which React 19 flags
// as a cascading render, and the leaderboard polled every 3 seconds to notice
// other tabs. `useSyncExternalStore` replaces both: one subscription, snapshots
// cached so they stay referentially stable, and cross-tab updates arrive via
// the native `storage` event instead of a timer.

import { useSyncExternalStore } from 'react';
import {
  Team, Submission, loadTeams, loadSubmissions, getLeaderboard, setChangeNotifier,
} from './persistence';

type Listener = () => void;
const listeners = new Set<Listener>();

/** Snapshot caches — `useSyncExternalStore` requires a stable reference between changes. */
let teamsCache: Team[] | null = null;
let leaderboardCache: Submission[] | null = null;

const EMPTY_TEAMS: Team[] = [];
const EMPTY_SUBMISSIONS: Submission[] = [];

/** Call after any write so every mounted hook re-reads. */
export function notifyLocalCollectionsChanged(): void {
  teamsCache = null;
  leaderboardCache = null;
  listeners.forEach((l) => l());
}

setChangeNotifier(() => notifyLocalCollectionsChanged());

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  // Another tab writing to localStorage fires `storage` here, not in the writer.
  const onStorage = () => notifyLocalCollectionsChanged();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useTeams(): Team[] {
  return useSyncExternalStore(
    subscribe,
    () => (teamsCache ??= loadTeams()),
    () => EMPTY_TEAMS, // server render: localStorage does not exist yet
  );
}

export function useLeaderboard(): Submission[] {
  return useSyncExternalStore(
    subscribe,
    () => (leaderboardCache ??= getLeaderboard()),
    () => EMPTY_SUBMISSIONS,
  );
}

/** True once the client has hydrated — use to avoid server/client markup mismatches. */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export { loadTeams, loadSubmissions };
