// Sea Zero — Persistence layer
// Cloud-backed storage via Cloudflare D1 (accessed through Next.js API routes)
//
// All data operations hit /api/* routes which talk to D1 on the server.
// Types are kept identical to the original localStorage-based layer so
// downstream components don't need schema changes.

import { Port } from '@/data/ports';
import { Leg } from '@/data/legs';
import { SimulationConfig, SimulationResult, EconomicsResult, EmissionsResult } from '@/engine/types';

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

export interface ScoreBreakdown {
  feasibilityBonus: number;   // -100 if fully feasible
  deadZonePenalty: number;    // +50 per dead zone
  npvScore: number;           // normalized NPV gap
  co2Score: number;           // reward for CO2 abated
  totalScore: number;
}

export interface CustomRoute {
  ports: Port[];
  legs: Leg[];
  routeName: string;
  uploadedAt: number;
}

// ─── Score Computation (pure function, no storage) ───

/**
 * Compute the competition score for a submission. Lower score = better.
 *
 * NOTE ON INTEGRITY: this runs in the browser and the result is stored in
 * the cloud database. If scores need to count, submissions should be
 * re-scored server-side from the submitted config.
 */
export function computeScore(
  simResult: SimulationResult,
  economics: EconomicsResult,
  emissions: EmissionsResult,
): ScoreBreakdown {
  // Feasibility bonus: -100 if fully feasible
  const feasibilityBonus = simResult.feasible ? -100 : 0;

  // Dead zone penalty: +50 per dead zone
  const deadZonePenalty = simResult.deadZoneCount * 50;

  // NPV score: normalize to 0–100 scale
  // Baseline: $50M gap → 50 points, negative gap → negative points
  const npvScore = economics.npvGap / 1_000_000; // $1M = 1 point

  // CO2 reward: more abatement → more negative (better)
  // Baseline: 50kt over 10yr → -50 points
  const co2Score = -(emissions.co2Abated10yr / 1000); // 1kt = -1 point

  const totalScore = feasibilityBonus + deadZonePenalty + npvScore + co2Score;

  return {
    feasibilityBonus,
    deadZonePenalty,
    npvScore: Math.round(npvScore * 10) / 10,
    co2Score: Math.round(co2Score * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
  };
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
): Promise<Submission> {
  const breakdown = computeScore(simResult, economics, emissions);

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

