import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { d1Query, d1Execute } from '@/lib/d1';
<<<<<<< HEAD
import { requireUser, requireAdmin } from '@/lib/apiAuth';
=======
>>>>>>> origin/master

// ─── GET /api/teams — list all teams ───

export async function GET() {
  try {
<<<<<<< HEAD
    // Team list feeds the compete-page selector — any signed-in user.
    const auth = await requireUser();
    if (auth.response) return auth.response;

=======
>>>>>>> origin/master
    const teams = await d1Query<{
      id: string;
      name: string;
      color: string;
      created_at: number;
    }>('SELECT id, name, color, created_at FROM teams ORDER BY created_at ASC');

    // Map snake_case → camelCase for the frontend
    const mapped = teams.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      createdAt: t.created_at,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error('GET /api/teams error:', err);
    return NextResponse.json({ error: 'Failed to load teams' }, { status: 500 });
  }
}

// ─── POST /api/teams — create a team ───

export async function POST(request: NextRequest) {
  try {
<<<<<<< HEAD
    // Teams are created from the admin console only.
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

=======
>>>>>>> origin/master
    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const safeColor = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : '#4A90CC';

    await d1Execute(
      'INSERT INTO teams (id, name, color) VALUES (?1, ?2, ?3)',
      [id, name.trim().slice(0, 80), safeColor],
    );

    return NextResponse.json({ id, name: name.trim(), color: safeColor, createdAt: Date.now() });
  } catch (err) {
    console.error('POST /api/teams error:', err);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

// ─── DELETE /api/teams?id=xxx — delete a team and its submissions ───

export async function DELETE(request: NextRequest) {
  try {
<<<<<<< HEAD
    // Deleting a team cascades to its submissions — admin only.
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

=======
>>>>>>> origin/master
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('id');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Delete submissions first (D1 may not enforce FK cascades via REST API)
    await d1Execute('DELETE FROM submissions WHERE team_id = ?1', [teamId]);
    await d1Execute('DELETE FROM teams WHERE id = ?1', [teamId]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/teams error:', err);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
