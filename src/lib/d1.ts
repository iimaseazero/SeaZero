// Sea Zero — Cloudflare D1 REST API client (server-only)
//
// All D1 access goes through this module. It talks to the Cloudflare REST API
// at api.cloudflare.com. The three env vars below must be set in .env.local
// and in the Vercel dashboard.

/**
 * Resolve the D1 credentials, naming what is missing.
 *
 * These were read at module scope behind non-null assertions, so a deployment
 * with the variables unset built a URL containing the literal string
 * "undefined" and every query failed with an opaque 400 from Cloudflare. The
 * check below turns that into one legible message instead.
 *
 * Read per call rather than once at import: on a serverless platform the
 * module may be evaluated before the environment is fully populated.
 */
function d1Endpoint(): { url: string; token: string } {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  const missing = [
    !accountId && 'CLOUDFLARE_ACCOUNT_ID',
    !databaseId && 'CLOUDFLARE_D1_DATABASE_ID',
    !apiToken && 'CLOUDFLARE_API_TOKEN',
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Cloudflare D1 is not configured — missing ${missing.join(', ')}. ` +
      'Set these in your hosting provider environment variables. Everything except ' +
      'sign-in, teams, submissions and admin works without them.',
    );
  }

  return {
    url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    token: apiToken as string,
  };
}

interface D1Result<T> {
  results: T[];
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1Response<T> {
  result: D1Result<T>[];
  success: boolean;
  errors: { code: number; message: string }[];
  messages: string[];
}

/**
 * Execute a SQL query against D1 and return the rows.
 * Use for SELECT statements.
 */
export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const { url, token } = d1Endpoint();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 query failed (${res.status}): ${text}`);
  }

  const data: D1Response<T> = await res.json();

  if (!data.success || data.errors?.length) {
    throw new Error(`D1 error: ${data.errors?.map((e) => e.message).join(', ') || 'Unknown'}`);
  }

  return data.result?.[0]?.results ?? [];
}

/**
 * Execute a SQL statement against D1 (INSERT, UPDATE, DELETE).
 * Returns the number of rows changed.
 */
export async function d1Execute(
  sql: string,
  params: unknown[] = [],
): Promise<{ changes: number; lastRowId: number }> {
  const { url, token } = d1Endpoint();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 execute failed (${res.status}): ${text}`);
  }

  const data: D1Response<never> = await res.json();

  if (!data.success || data.errors?.length) {
    throw new Error(`D1 error: ${data.errors?.map((e) => e.message).join(', ') || 'Unknown'}`);
  }

  const meta = data.result?.[0]?.meta;
  return { changes: meta?.changes ?? 0, lastRowId: meta?.last_row_id ?? 0 };
}
