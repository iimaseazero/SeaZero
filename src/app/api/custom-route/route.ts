import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { d1Query, d1Execute } from '@/lib/d1';
<<<<<<< HEAD
import { requireUser, requireAdmin } from '@/lib/apiAuth';
=======
>>>>>>> origin/master

// ─── GET /api/custom-route — load the saved custom route (singleton) ───

export async function GET() {
  try {
<<<<<<< HEAD
    // The active route is needed by every signed-in user.
    const auth = await requireUser();
    if (auth.response) return auth.response;

=======
>>>>>>> origin/master
    const rows = await d1Query<{
      ports: string;
      legs: string;
      route_name: string;
      uploaded_at: number;
    }>('SELECT ports, legs, route_name, uploaded_at FROM custom_routes WHERE id = 1');

    if (rows.length === 0) {
      return NextResponse.json(null);
    }

    const r = rows[0];
    return NextResponse.json({
      ports: JSON.parse(r.ports),
      legs: JSON.parse(r.legs),
      routeName: r.route_name,
      uploadedAt: r.uploaded_at,
    });
  } catch (err) {
    console.error('GET /api/custom-route error:', err);
    return NextResponse.json({ error: 'Failed to load custom route' }, { status: 500 });
  }
}

// ─── POST /api/custom-route — save / replace the custom route ───

export async function POST(request: NextRequest) {
  try {
<<<<<<< HEAD
    // Replacing the route changes it for the whole cohort.
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

=======
>>>>>>> origin/master
    const body = await request.json();
    const { ports, legs, routeName, uploadedAt } = body;

    if (!ports || !legs) {
      return NextResponse.json({ error: 'Route data is incomplete' }, { status: 400 });
    }

    // Upsert: INSERT OR REPLACE on id=1
    await d1Execute(
      `INSERT OR REPLACE INTO custom_routes (id, ports, legs, route_name, uploaded_at)
       VALUES (1, ?1, ?2, ?3, ?4)`,
      [
        JSON.stringify(ports),
        JSON.stringify(legs),
        routeName || 'Custom Route',
        uploadedAt ?? Date.now(),
      ],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/custom-route error:', err);
    return NextResponse.json({ error: 'Failed to save custom route' }, { status: 500 });
  }
}

// ─── DELETE /api/custom-route — clear the custom route ───

export async function DELETE() {
  try {
<<<<<<< HEAD
    // Resetting to the default route is an admin action.
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

=======
>>>>>>> origin/master
    await d1Execute('DELETE FROM custom_routes WHERE id = 1');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/custom-route error:', err);
    return NextResponse.json({ error: 'Failed to clear custom route' }, { status: 500 });
  }
}
