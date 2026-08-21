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

/** How often the leaderboard re-reads D1 while the tab is visible. */
const LEADERBOARD_POLL_MS = 5000;

/**
 * Live leaderboard.
 *
 * This used to fetch once on mount, so a team only ever saw the board as it
 * stood when they opened the page — other teams' submissions never appeared
 * without a reload, which is the opposite of what a competition needs. It now
 * polls, and pauses while the tab is hidden so a room full of open laptops
 * does not hammer the worker.
 */
export function useLeaderboard(): {
  submissions: Submission[];
  refreshLeaderboard: () => void;
  lastUpdated: number | null;
} {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const refreshLeaderboard = useCallback(() => {
    getLeaderboard().then((rows) => {
      setSubmissions(rows);
      setLastUpdated(Date.now());
    });
  }, []);

  useEffect(() => {
    refreshLeaderboard();

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer === null) timer = setInterval(refreshLeaderboard, LEADERBOARD_POLL_MS);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        refreshLeaderboard();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshLeaderboard]);

  return { submissions, refreshLeaderboard, lastUpdated };
}

/** True once the client has hydrated — use to avoid server/client markup mismatches. */
export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
}

// Re-export for convenience
export { loadTeams } from './persistence';
