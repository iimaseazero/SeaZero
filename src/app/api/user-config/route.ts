import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { d1Query, d1Execute } from '@/lib/d1';
import { getSessionUser } from '@/lib/session';

// ─── GET /api/user-config — load current user's saved simulation config ───

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await d1Query<{
      config: string;
      updated_at: number;
    }>('SELECT config, updated_at FROM user_configs WHERE user_id = ?1', [sessionUser.id]);

    if (rows.length === 0) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({
      config: JSON.parse(rows[0].config),
      updatedAt: rows[0].updated_at,
    });
  } catch (err) {
    console.error('GET /api/user-config error:', err);
    return NextResponse.json({ error: 'Failed to load user config' }, { status: 500 });
  }
}

// ─── PUT /api/user-config — save / update current user's simulation config ───

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { config } = body;

    if (typeof config !== 'object' || config === null) {
      return NextResponse.json({ error: 'config must be an object' }, { status: 400 });
    }

    await d1Execute(
      `INSERT OR REPLACE INTO user_configs (user_id, config, updated_at)
       VALUES (?1, ?2, ?3)`,
      [sessionUser.id, JSON.stringify(config), Date.now()],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/user-config error:', err);
    return NextResponse.json({ error: 'Failed to save user config' }, { status: 500 });
  }
}
