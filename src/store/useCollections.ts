'use client';

// Sea Zero — React hooks for cloud-backed collections.
//
// Replaced the old localStorage + useSyncExternalStore pattern with
// simple useState + useEffect + fetch. Data comes from /api/* routes
// which talk to Cloudflare D1 on the server.

import { useState, useEffect, useCallback } from 'react';
import { Team, Submission, loadTeams, getLeaderboard } from './persistence';

// ─── useTeams ───

export function useTeams(): { teams: Team[]; refreshTeams: () => void } {
  const [teams, setTeams] = useState<Team[]>([]);

  const refreshTeams = useCallback(() => {
    loadTeams().then(setTeams);
  }, []);

  useEffect(() => {
    refreshTeams();
  }, [refreshTeams]);

  return { teams, refreshTeams };
}

// ─── useLeaderboard ───

export function useLeaderboard(): { submissions: Submission[]; refreshLeaderboard: () => void } {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const refreshLeaderboard = useCallback(() => {
    getLeaderboard().then(setSubmissions);
  }, []);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  return { submissions, refreshLeaderboard };
}

/** True once the client has hydrated — use to avoid server/client markup mismatches. */
export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
}

// Re-export for convenience
export { loadTeams } from './persistence';
