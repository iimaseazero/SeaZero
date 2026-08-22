import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { d1Query, d1Execute } from '@/lib/d1';
import { getSessionUser } from '@/lib/session';
<<<<<<< HEAD
import { requireUser } from '@/lib/apiAuth';
=======
>>>>>>> origin/master

// ─── GET /api/frozen-controls — load the current frozen controls (all users) ───

export async function GET() {
  try {
<<<<<<< HEAD
    // Which controls an instructor has locked is not secret, but there is no
    // reason to serve it to the open internet either.
    const auth = await requireUser();
    if (auth.response) return auth.response;

=======
>>>>>>> origin/master
    const rows = await d1Query<{
      locked_keys: string;
      updated_at: number;
    }>('SELECT locked_keys, updated_at FROM frozen_controls WHERE id = 1');

    if (rows.length === 0) {
      return NextResponse.json({ lockedKeys: {} });
    }

    return NextResponse.json({
      lockedKeys: JSON.parse(rows[0].locked_keys),
      updatedAt: rows[0].updated_at,
    });
  } catch (err) {
    console.error('GET /api/frozen-controls error:', err);
    return NextResponse.json({ error: 'Failed to load frozen controls' }, { status: 500 });
  }
}

// ─── PUT /api/frozen-controls — admin-only: update frozen controls ───

export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { lockedKeys } = body;

    if (typeof lockedKeys !== 'object' || lockedKeys === null) {
      return NextResponse.json({ error: 'lockedKeys must be an object' }, { status: 400 });
    }

    // Upsert: INSERT OR REPLACE on id=1
    await d1Execute(
      `INSERT OR REPLACE INTO frozen_controls (id, locked_keys, updated_at)
       VALUES (1, ?1, ?2)`,
      [JSON.stringify(lockedKeys), Date.now()],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/frozen-controls error:', err);
    return NextResponse.json({ error: 'Failed to save frozen controls' }, { status: 500 });
  }
}
