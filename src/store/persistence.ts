// Sea Zero — Persistence layer
// localStorage-based storage for teams, submissions, and custom routes

import { Port, GridTier } from '@/data/ports';
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

// ─── Storage Keys ───

const KEYS = {
  TEAMS: 'sea-zero-teams',
  SUBMISSIONS: 'sea-zero-submissions',
  CUSTOM_ROUTE: 'sea-zero-custom-route',
} as const;

// ─── ID Generator ───

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Team Operations ───

export function loadTeams(): Team[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.TEAMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTeams(teams: Team[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.TEAMS, JSON.stringify(teams));
}

export function addTeam(name: string, color: string): Team {
  const teams = loadTeams();
  const team: Team = {
    id: generateId(),
    name,
    color,
    createdAt: Date.now(),
  };
  teams.push(team);
  saveTeams(teams);
  return team;
}

export function deleteTeam(teamId: string): void {
  const teams = loadTeams().filter((t) => t.id !== teamId);
  saveTeams(teams);
  // Also remove associated submissions
  const subs = loadSubmissions().filter((s) => s.teamId !== teamId);
  saveSubmissions(subs);
}

// ─── Submission Operations ───

export function loadSubmissions(): Submission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.SUBMISSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSubmissions(submissions: Submission[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(submissions));
}

/**
 * Compute the competition score for a submission.
 * Lower score = better.
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

export function addSubmission(
  team: Team,
  config: SimulationConfig,
  simResult: SimulationResult,
  economics: EconomicsResult,
  emissions: EmissionsResult,
): Submission {
  const submissions = loadSubmissions();
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

  // Replace existing submission for same team, or add new
  const existingIdx = submissions.findIndex((s) => s.teamId === team.id);
  if (existingIdx >= 0) {
    submissions[existingIdx] = submission;
  } else {
    submissions.push(submission);
  }

  saveSubmissions(submissions);
  return submission;
}

export function getLeaderboard(): Submission[] {
  return loadSubmissions().sort((a, b) => a.score - b.score);
}

// ─── Custom Route Operations ───

export function loadCustomRoute(): CustomRoute | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_ROUTE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomRoute(route: CustomRoute): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.CUSTOM_ROUTE, JSON.stringify(route));
}

export function clearCustomRoute(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.CUSTOM_ROUTE);
}
