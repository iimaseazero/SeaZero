<<<<<<< HEAD
# Sea Zero

An interactive decision simulator for the Harvard Business School case
**Hurtigruten: Sea Zero** (9-625-100). It models the Bergen–Kirkenes Kystruten
voyage leg by leg and lets you answer the two questions Hedda Felin faces: how
dense a port charging network to build, and whether to commission a
battery-electric vessel or an efficiency-upgraded conventional one.

Every number traces back to the case. Values the case does not supply are
marked `[ASSUMPTION]` in `src/engine/constants.ts` and listed in the exported
workbook's **Case constants** sheet.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional for local dev — see below
npm run dev
```

Open <http://localhost:3000>.

The simulator, all charts and the Excel export are **entirely client-side** and
work with no configuration at all. Only sign-in, teams, submissions and the
admin console need a database.

## What it does

**Simulator** (`/`) — the voyage energy profile, battery state of charge at
every one of the 67 port calls, a 10-year discounted TCO comparison, emissions,
and four decision analyses: a feasibility frontier over battery size against
connector rating, the marginal value of the Nth charger, a tornado sensitivity
on the NPV verdict, and a speed trade-off indexed to the case's 13.2 kn
benchmark.

**Compete** (`/compete`) — teams submit a bid, scored out of 100 on
reliability, cost, climate and service. Each submission is run against a
nine-scenario stress panel (weather, full load, charger outage, aged pack, and
four opposed price scenarios), so cost is judged at the team's *worst* case
rather than its most optimistic. The leaderboard updates live and plots every
bid on a cost-versus-robustness frontier.

**Admin** (`/admin`) — upload a custom route from a spreadsheet, freeze
individual controls so a cohort works from the same assumptions, manage teams.

**Export** — the button under the config panel downloads a 15-sheet `.xlsx`
containing everything behind the charts: configuration, ports, every voyage
leg, cash flows, the payback path, emissions, all four analyses, the stress
panel, and the sourced case constants.

## Environment variables

See `.env.example` for the full list with instructions.

| Variable | Needed for | If unset |
|---|---|---|
| `JWT_SECRET` | Sessions | **Authentication is disabled in production.** Required before deploying. |
| `CLOUDFLARE_ACCOUNT_ID` | D1 access | Sign-in, teams, submissions and admin fail; the simulator still works |
| `CLOUDFLARE_D1_DATABASE_ID` | D1 access | as above |
| `CLOUDFLARE_API_TOKEN` | D1 access | as above |
| `ADMIN_EMAIL` | `/admin` | Nobody gets admin — the check fails closed |

`JWT_SECRET` deliberately has **no production fallback**. Generate one with
`openssl rand -base64 32`. Without it the app refuses to sign or verify tokens
rather than trust a secret that is visible in the source.

## Database

Data lives in Cloudflare D1, reached over the REST API — so the app can be
hosted anywhere, not just on Cloudflare. Create the schema once:

```bash
npx wrangler d1 execute sea-zero-db --remote --file=./d1/schema.sql
```

## Deploying to Vercel

1. `git init && git add -A && git commit -m "Initial commit"`, then push to a
   Git host. Check that `Project Case.pdf` is **not** in the commit —
   `.gitignore` excludes it because the HBS copyright notice forbids posting or
   transmitting the case.
2. Import the repository at [vercel.com/new](https://vercel.com/new). Framework
   and build settings are detected automatically; there is nothing to override.
3. Add the environment variables above under **Settings → Environment
   Variables**, for Production *and* Preview. `JWT_SECRET` is not optional.
4. Deploy, then create your first account at `/login`. Set `ADMIN_EMAIL` to
   that address to reach `/admin`.

Everything renders as static pages plus a handful of dynamic route handlers, so
it fits comfortably in the Hobby tier. `wrangler.toml` is only used by the
`wrangler` CLI for schema migrations and is ignored by Vercel.

## Checks

```bash
npx tsc --noEmit   # types
npm run lint       # eslint
npm run build      # production build
```
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> origin/master
