import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { d1Query, d1Execute } from '@/lib/d1';
import { requireUser, requireAdmin } from '@/lib/apiAuth';

// ─── GET /api/submissions — leaderboard (sorted by score DESCENDING) ───
//
// The score was rewritten to be a 0-100 index where higher is better, so the
// ordering flipped. See engine/scoring.ts for why.

export async function GET() {
  try {
    // Leaderboard is visible to any signed-in user.
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const rows = await d1Query<{
      id: string;
      team_id: string;
      team_name: string;
      team_color: string;
      config: string;
      sim_result: string;
      economics: string;
      emissions: string;
      score: number;
      breakdown: string;
      submitted_at: number;
    }>('SELECT * FROM submissions ORDER BY score DESC');

    const mapped = rows.map((r) => ({
      id: r.id,
      teamId: r.team_id,
      teamName: r.team_name,
      teamColor: r.team_color,
      config: JSON.parse(r.config),
      simResult: JSON.parse(r.sim_result),
      economics: JSON.parse(r.economics),
      emissions: JSON.parse(r.emissions),
      score: r.score,
      breakdown: JSON.parse(r.breakdown),
      submittedAt: r.submitted_at,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error('GET /api/submissions error:', err);
    return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 });
  }
}

// ─── POST /api/submissions — create or update a submission for a team ───

export async function POST(request: NextRequest) {
  try {
    // Submitting requires a session; the handler upserts by team.
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const body = await request.json();
    const {
      id,
      teamId,
      teamName,
      teamColor,
      config,
      simResult,
      economics,
      emissions,
      score,
      breakdown,
      submittedAt,
    } = body;

    if (!teamId || !id) {
      return NextResponse.json({ error: 'Submission data is incomplete' }, { status: 400 });
    }

    // Delete existing submission for this team (upsert pattern)
    await d1Execute('DELETE FROM submissions WHERE team_id = ?1', [teamId]);

    // Insert new submission
    await d1Execute(
      `INSERT INTO submissions (id, team_id, team_name, team_color, config, sim_result, economics, emissions, score, breakdown, submitted_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
      [
        id,
        teamId,
        teamName,
        teamColor,
        JSON.stringify(config),
        JSON.stringify(simResult),
        JSON.stringify(economics),
        JSON.stringify(emissions),
        score,
        JSON.stringify(breakdown),
        submittedAt ?? Date.now(),
      ],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/submissions error:', err);
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
  }
}
