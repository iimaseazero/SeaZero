// Sea Zero — Persistence layer
// localStorage-based storage for teams, submissions, and custom routes

//
// Everything in here crosses a trust boundary. localStorage is fully writable
// by anyone with a devtools console, and it also survives schema changes across
// deploys, so nothing read back from it is assumed to be well-formed.

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

// ─── Change notification ───
//
// Set by the React binding layer so components re-read after a write. Kept as a
// plain callback to avoid this module depending on React.
let onChange: () => void = () => {};
export function setChangeNotifier(fn: () => void): void {
  onChange = fn;
}

// ─── ID Generator ───

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Validation ───
//
// Values read back from localStorage are untrusted: a stale schema from an
// older deploy, or anything a user typed into the console. Team colours in
// particular are interpolated straight into inline `style` props, so an
// unvalidated string would be a CSS injection sink.

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const FALLBACK_COLOR = '#4A90CC';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function safeText(v: unknown, max = 80): string {
  return String(v ?? '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, max);
}

function safeColor(v: unknown): string {
  const s = String(v ?? '');
  return HEX_COLOR.test(s) ? s : FALLBACK_COLOR;
}

function safeNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseTeam(raw: unknown): Team | null {
  if (!isRecord(raw)) return null;
  const name = safeText(raw.name);
  const id = safeText(raw.id, 64);
  if (!name || !id) return null;
  return { id, name, color: safeColor(raw.color), createdAt: safeNumber(raw.createdAt) };
}

/** Read and parse a JSON array from localStorage, discarding anything malformed. */
function readArray<T>(key: string, parse: (raw: unknown) => T | null): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parse).filter((v): v is T => v !== null);
  } catch {
    return [];
  }
}

// ─── Team Operations ───

export function loadTeams(): Team[] {
  return readArray(KEYS.TEAMS, parseTeam);
}

export function saveTeams(teams: Team[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.TEAMS, JSON.stringify(teams));
  onChange();
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

function parseSubmission(raw: unknown): Submission | null {
  if (!isRecord(raw)) return null;
  const id = safeText(raw.id, 64);
  const teamId = safeText(raw.teamId, 64);
  if (!id || !teamId) return null;
  if (!isRecord(raw.simResult) || !isRecord(raw.economics) || !isRecord(raw.emissions)) return null;
  if (!isRecord(raw.config) || !isRecord(raw.breakdown)) return null;

  // The nested result objects are only ever read for display, so they are
  // passed through as-is — but every field the leaderboard actually renders is
  // normalised here so a hand-edited entry cannot break the table.
  return {
    id,
    teamId,
    teamName: safeText(raw.teamName) || 'Unknown team',
    teamColor: safeColor(raw.teamColor),
    config: raw.config as unknown as SimulationConfig,
    simResult: {
      ...(raw.simResult as unknown as SimulationResult),
      feasible: raw.simResult.feasible === true,
      deadZoneCount: safeNumber(raw.simResult.deadZoneCount),
    },
    economics: {
      ...(raw.economics as unknown as EconomicsResult),
      npvGap: safeNumber(raw.economics.npvGap),
    },
    emissions: {
      ...(raw.emissions as unknown as EmissionsResult),
      co2Abated10yr: safeNumber(raw.emissions.co2Abated10yr),
    },
    score: safeNumber(raw.score),
    breakdown: raw.breakdown as unknown as ScoreBreakdown,
    submittedAt: safeNumber(raw.submittedAt),
  };
}

export function loadSubmissions(): Submission[] {
  return readArray(KEYS.SUBMISSIONS, parseSubmission);
}

export function saveSubmissions(submissions: Submission[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(submissions));
  onChange();
}

/**
 * Compute the competition score for a submission. Lower score = better.
 *
 * NOTE ON INTEGRITY: this runs in the browser and the result is stored in
 * localStorage, so a participant can set their own score to anything from the
 * devtools console. There is no server, no authentication and no signature.
 * Treat the leaderboard as a shared scratchpad, not as a graded result — if
 * scores need to count, submissions have to be re-scored server-side from the
 * submitted config.
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

const GRID_TIERS: readonly GridTier[] = ['strong', 'medium', 'weak'];

function parsePort(raw: unknown, index: number): Port | null {
  if (!isRecord(raw)) return null;
  const name = safeText(raw.name);
  const lat = safeNumber(raw.lat, NaN);
  const lng = safeNumber(raw.lng, NaN);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const tier = GRID_TIERS.includes(raw.gridTier as GridTier) ? (raw.gridTier as GridTier) : 'weak';
  return {
    // Re-index on load so ids always match array positions, whatever was stored.
    id: index,
    name,
    lat,
    lng,
    gridTier: tier,
    portStayMinutes: index === 0 ? 0 : Math.min(24 * 60, Math.max(0, safeNumber(raw.portStayMinutes))),
  };
}

/**
 * A stored route is only usable if its ports and legs are mutually consistent.
 * Rather than trusting the stored legs, they are rebuilt from the port order
 * and only their distances are carried across.
 */
export function loadCustomRoute(): CustomRoute | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_ROUTE);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.ports) || !Array.isArray(parsed.legs)) return null;

    const ports = parsed.ports
      .map((p, i) => parsePort(p, i))
      .filter((p): p is Port => p !== null)
      .map((p, i) => ({ ...p, id: i, portStayMinutes: i === 0 ? 0 : p.portStayMinutes }));
    if (ports.length < 2) return null;

    const storedLegs = parsed.legs as unknown[];
    const legs: Leg[] = [];
    for (let i = 0; i < ports.length - 1; i++) {
      const stored = isRecord(storedLegs[i]) ? (storedLegs[i] as Record<string, unknown>) : null;
      const distanceKm = safeNumber(stored?.distanceKm, NaN);
      const baselineSailHours = safeNumber(stored?.baselineSailHours, NaN);
      if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
      if (!Number.isFinite(baselineSailHours) || baselineSailHours <= 0) return null;
      legs.push({ index: i, fromPortId: i, toPortId: i + 1, distanceKm, baselineSailHours });
    }

    return {
      ports,
      legs,
      routeName: safeText(parsed.routeName) || 'Custom Route',
      uploadedAt: safeNumber(parsed.uploadedAt),
    };
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
