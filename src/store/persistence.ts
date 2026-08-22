// Sea Zero — Persistence layer
// Cloud-backed storage via Cloudflare D1 (accessed through Next.js API routes)
//
// All data operations hit /api/* routes which talk to D1 on the server.
// Types are kept identical to the original localStorage-based layer so
// downstream components don't need schema changes.

import { Port } from '@/data/ports';
import { Leg } from '@/data/legs';
import { SimulationConfig, SimulationResult, EconomicsResult, EmissionsResult } from '@/engine/types';
import { scoreSubmission, ScoreBreakdown } from '@/engine/scoring';

// Scoring lives in the engine now — it runs a stress panel over `simulate`,
// so it needs the route, not just the headline results. Re-exported here so
// existing imports keep working.
export type { ScoreBreakdown } from '@/engine/scoring';
export { scoreSubmission } from '@/engine/scoring';

// ─── Types ───

export interface Team {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  config: SimulationConfig;
  simResult: SimulationResult;
  economics: EconomicsResult;
  emissions: EmissionsResult;
  score: number;
  breakdown: ScoreBreakdown;
  submittedAt: number;
}

export interface CustomRoute {
  ports: Port[];
  legs: Leg[];
  routeName: string;
  uploadedAt: number;
}

// ─── ID Generator ───

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Team Operations (async, D1-backed) ───

export async function loadTeams(): Promise<Team[]> {
  try {
    const res = await fetch('/api/teams');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addTeam(name: string, color: string): Promise<Team> {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  return await res.json();
}

export async function deleteTeam(teamId: string): Promise<void> {
  await fetch(`/api/teams?id=${encodeURIComponent(teamId)}`, {
    method: 'DELETE',
  });
}

// ─── Submission Operations (async, D1-backed) ───

export async function loadSubmissions(): Promise<Submission[]> {
  try {
    const res = await fetch('/api/submissions');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addSubmission(
  team: Team,
  config: SimulationConfig,
  simResult: SimulationResult,
  economics: EconomicsResult,
  emissions: EmissionsResult,
  ports: Port[],
  legs: Leg[],
): Promise<Submission> {
  const breakdown = scoreSubmission(config, ports, legs);

  const submission: Submission = {
    id: generateId(),
    teamId: team.id,
    teamName: team.name,
    teamColor: team.color,
    config,
    simResult,
    economics,
    emissions,
    score: breakdown.totalScore,
    breakdown,
    submittedAt: Date.now(),
  };

  await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });

  return submission;
}

export async function getLeaderboard(): Promise<Submission[]> {
  return loadSubmissions(); // API already returns sorted by score
}

// ─── Custom Route Operations (async, D1-backed) ───

export async function loadCustomRoute(): Promise<CustomRoute | null> {
  try {
    const res = await fetch('/api/custom-route');
    if (!res.ok) return null;
    const data = await res.json();
    return data; // null if no route saved
  } catch {
    return null;
  }
}

export async function saveCustomRoute(route: CustomRoute): Promise<void> {
  await fetch('/api/custom-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(route),
  });
}

export async function clearCustomRoute(): Promise<void> {
  await fetch('/api/custom-route', { method: 'DELETE' });
}

// ─── User Config Operations (async, D1-backed) ───

export async function loadUserConfig(): Promise<SimulationConfig | null> {
  try {
    const res = await fetch('/api/user-config');
    if (!res.ok) return null;
    const data = await res.json();
    return data.config ?? null;
  } catch {
    return null;
  }
}

export async function saveUserConfig(config: SimulationConfig): Promise<void> {
  try {
    await fetch('/api/user-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
  } catch {
    // Silently handle offline/error saving
  }
}

