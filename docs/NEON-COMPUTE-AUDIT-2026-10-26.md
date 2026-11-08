# Neon compute audit: where the CU-hours are going

**Status:** Findings only. Nothing in this document has been applied.
**Date:** 2026-10-26
**Trigger:** 160 CU-hrs consumed and rising.
**Method:** Static read of this repository at `fix/build-and-admin-export` (11fa29b).
No queries were run against the live database, see "What I could not measure".

---

## 0. The one-paragraph version

Compute cost on Neon is **time the compute is awake**, not queries executed. Neon
suspends a compute after 5 minutes with no activity and bills `compute size x
hours awake`. So the question is not "which query is slow" but "what touches the
database often enough that the 5-minute timer never expires". Three things do,
and all three run with **zero users on the site**:

1. `exam-sweep` runs every 15 minutes, which buys a minimum of 5 awake minutes per
   tick, so roughly **8 hours a day of billed compute floor**, forever.
2. The notification poller fires every 30 seconds per visible signed-in tab. One
   tab left open on one desk holds the compute awake **continuously**.
3. `.env` points local development at the **same compute endpoint as production**
   (`ep-black-sound-a581h8hu`), so a dev day is billed as production compute.

On top of that, the awake time is more expensive per hour than it needs to be,
because Neon autoscales on load and the hot paths do sequential scans: 100 models
in the schema, and `notifications`, `transactions`, `courses` and `enrollments`
are all missing indexes on the exact columns the hot queries filter by.

---

## 1. How Neon actually bills (verified, not assumed)

| Fact | Source |
|---|---|
| Compute is metered in CU-hours = compute size x hours running | [Neon plans](https://neon.com/docs/introduction/plans) |
| With autoscaling, size billed is the average across the min/max range, so load-heavy queries cost more per awake hour | [Neon plans](https://neon.com/docs/introduction/plans) |
| Compute suspends after **5 minutes** of inactivity by default | [Scale to zero](https://neon.com/docs/introduction/scale-to-zero) |
| Connecting from a client reactivates an idle compute | [Scale to zero guide](https://neon.com/docs/guides/scale-to-zero-guide) |
| Storage is billed continuously whether compute runs or not | [Neon plans](https://neon.com/docs/introduction/plans) |

Neon's docs do **not** state whether an open-but-idle connection by itself blocks
suspension; they only define inactivity, with logical replication as the one
named exception. The findings below therefore rely only on the defensible version
of the claim: **a query resets the 5-minute timer.** Every estimate here is built
from that alone.

The practical consequence, and the number worth internalising:

> Anything that queries the database more often than once every 5 minutes costs
> the same as a database that never sleeps.

---

## 2. What I could not measure

Read these gaps before acting on the numbers.

- **The Neon MCP server is not authorised in this session.** I could not read the
  project's actual compute size, autosuspend setting, autoscaling range, or the
  per-hour breakdown of the 160 CU-hrs. Authorise it, or open the Neon console,
  and the estimates in section 4 become measurements.
- **I did not query the production database.** No row counts, no
  `pg_stat_statements`, no `pg_stat_user_tables` sequential-scan counts, no
  `pg_indexes`. The index findings come from the Prisma schema, not the live
  catalog.
- **Migrations and schema have diverged.** `prisma/migrations/` stops at
  `20260218_add_ip_brute_force_protection` and contains only 13 `CREATE INDEX`
  statements, while `schema.prisma` declares 63 `@@index` across 100 models. The
  exam, bootcamp and program tables are in the schema but in no migration, so
  later changes were applied with `prisma db push`. Which indexes actually exist
  in `prod_db_v2` cannot be determined from this repo. Section 5.7 therefore
  starts with a verification query rather than a fix.
- **Billing period unknown.** "160 CU-hrs so far" has no window attached, so
  section 4 gives a monthly rate to compare against rather than reconciling to
  160 exactly.

---

## 3. Findings, ranked by estimated share of the bill

### F1. The scheduled sweeps alone establish an ~8 h/day billed floor

**Where:** [.github/workflows/exam-sweep.yml](../.github/workflows/exam-sweep.yml),
[.github/workflows/payment-sweep.yml](../.github/workflows/payment-sweep.yml),
[app/api/cron/exam-sweep/route.ts:46](../app/api/cron/exam-sweep/route.ts#L46),
[app/api/cron/payment-sweep/route.ts:58](../app/api/cron/payment-sweep/route.ts#L58)

`exam-sweep` is on `*/15 * * * *` and `payment-sweep` on `0,30 * * * *`. The
workflow comments show this was already reduced from every 5 minutes, and the
alignment of the two schedules so they share a wake-up is deliberate and correct.
The problem is arithmetic the reduction does not escape:

- 96 exam-sweep ticks per day.
- Each tick issues real queries, so each resets the 5-minute idle timer.
- 96 x 5 min = **480 min = 8 hours of awake compute per day, minimum**, before a
  single visitor arrives.
- `payment-sweep` lands on `:00` and `:30`, inside an exam-sweep wake-up, so it
  adds no additional wake-ups. That part of the design works.

Both endpoints query unconditionally: `sweepExams` then `countLiveAttempts`, and
`sweepPendingPayments` then `countStrandedPayments` then `countDriftingWallets`.
There is no cheap pre-check, so a tick with nothing to do costs the same awake
window as a tick that does work.

`countDriftingWallets` is the most expensive of these and runs every 30 minutes
forever:

```ts
// lib/payments/sweep.ts:107-114
db.user.findMany({ where: { OR: [{ walletBalance: { not: 0 } }, { walletEntries: { some: {} } }] }, ... }),
db.walletEntry.groupBy({ by: ["userId"], _sum: { amount: true } }),
```

A full aggregate over `wallet_entries` plus a correlated existence check over
`users`, 48 times a day, purely to log a number that should always be zero.

### F2. The notification poller holds the compute awake continuously

**Where:** [hooks/useNotificationPolling.ts:15](../hooks/useNotificationPolling.ts#L15),
[lib/notifications/notification-provider.tsx:28](../lib/notifications/notification-provider.tsx#L28),
[app/layout.tsx:155](../app/layout.tsx#L155),
[app/api/notifications/route.ts:9](../app/api/notifications/route.ts#L9)

`POLL_INTERVAL` is 30 seconds. `NotificationProvider` is mounted in the **root
layout**, so it is live on every page of the site for every signed-in user. The
scheduler itself is well built: armed once, no polling while the tab is hidden,
and a catch-up poll on visibility change. Those fixes are real and worth keeping.
They do not change the cost of the case that matters:

- One signed-in user with one **visible** tab = 2 queries every 30 seconds.
- 30 seconds is one tenth of the 5-minute idle timer, so the timer never expires.
- A tab left open from 9am to 6pm = **9 hours of continuous awake compute** from
  one person who may not be touching the site at all.

Each poll is two queries, not one, because the route calls `auth()` (see F3) and
then `db.notification.findMany`. And that `findMany` is a sequential scan:

```prisma
// prisma/schema.prisma:1123-1136
model Notification {
  userId    String
  createdAt DateTime @default(now())
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("notifications")   // no @@index at all
}
```

Postgres does not index foreign keys automatically. The query is
`where userId = ? and createdAt > ? order by createdAt desc limit 50` against a
table with no index on either column, so it scans `notifications` end to end,
every 30 seconds, per tab, and gets slower as the table grows. This is both a
wake-up source and an autoscaling driver.

### F3. Every `auth()` call is a database round-trip, and there are 258 of them

**Where:** [auth.ts:113](../auth.ts#L113), plus 258 `await auth()` call sites
across `app/`, `actions/`, `data/` and `lib/`.

The `jwt` callback reads the user on every invocation:

```ts
// auth.ts:113-118
if (token.sub) {
  const userActive = await db.user.findUnique({
    where: { id: token.sub as string },
    select: { role: true, name: true, mustChangePassword: true },
  });
```

This is guarded only by `if (token.sub)`, true for every signed-in request. I
verified against the installed Auth.js that the callback is not conditional on a
refresh:

```js
// node_modules/@auth/core/lib/actions/session.js:28
const token = await callbacks.jwt({ token: payload, ... });
```

In the JWT strategy that line runs on **every session read**, unconditionally.
`session.updateAge: 300` in [auth.config.ts:28](../auth.config.ts#L28) does not
throttle it; that setting only governs database-strategy session writes.

So the cost is one `users` row read per `auth()` call, and `auth()` is called:

- once in the root layout, on every page render ([app/layout.tsx:136](../app/layout.tsx#L136));
- again in the page itself on most authenticated routes;
- again in each server action the page invokes;
- again in each API route the client calls.

A single authenticated page load costs somewhere between 3 and 6 `users` reads.
Nothing deduplicates them within a request: there is no `React.cache()` wrapper
anywhere in `data/` or `actions/`. `lib/sanity-queries.ts` uses `cache()`, the
Prisma layer does not.

Two multipliers on top:

- `SessionProvider` at [app/layout.tsx:143](../app/layout.tsx#L143) does not pass
  `refetchOnWindowFocus`, and the next-auth default is `true`
  (`node_modules/next-auth/react.js:305`). Every return to the tab fires
  `/api/auth/session`, which is another user read, landing at the same moment as
  the poller's visibility-change catch-up poll.
- For `ADMIN` users the callback can also issue a `db.user.update` on a plain read
  path ([auth.ts:119-131](../auth.ts#L119)), turning a read into a write.

### F4. Local development bills production compute

**Where:** `.env`, two `DATABASE_URL` lines.

```
DATABASE_URL='postgresql://***@ep-black-sound-a581h8hu-pooler.us-east-2.aws.neon.tech/development?sslmode=require'
DATABASE_URL='postgresql://***@ep-black-sound-a581h8hu-pooler.us-east-2.aws.neon.tech/prod_db_v2?sslmode=require&channel_binding=require'
```

Both are the **same compute endpoint**. `development` and `prod_db_v2` are two
databases sharing one compute, so they share one CU-hour meter. Running
`pnpm dev` with the app open in a browser means F2 and F3 fire against the
endpoint that serves production, all day, and
[lib/db.ts:45](../lib/db.ts#L45) additionally turns on
`log: ["query", "error", "warn"]` in development.

Two secondary notes on the same file: two `DATABASE_URL` assignments means which
database is live depends on dotenv's last-write-wins, which is a bad thing to
leave to a parser; and the first URL lacks the `channel_binding=require` the
second has.

### F5. Public pages are fully dynamic, so crawler traffic is database traffic

**Where:** 49 `force-dynamic` exports. The costly ones are
[app/(root)/courses/page.tsx:29](<../app/(root)/courses/page.tsx#L29>),
[app/(root)/courses/[courseId]/page.tsx](<../app/(root)/courses/[courseId]/page.tsx>),
[app/sitemap.ts:9](../app/sitemap.ts#L9).

Only three routes in the entire app set a `revalidate`: two blog pages at 60s and
one OG image at 3600s. Everything else is either `force-dynamic` or made dynamic
implicitly by the root layout's `headers()` and `auth()` calls. Nothing public is
cached, so every hit from Googlebot, Bingbot, an AI crawler or a scraper runs the
full server render and its queries.

**`/courses`** on each hit runs:

| Call | Cost |
|---|---|
| `getPublicCourses()` | `syncExpiredPromotions()` plus the big course query below |
| `getActivePromotion()` | `getPromotionSettings()` plus `syncExpiredPromotions()` **again** plus a join-heavy `findFirst` plus **a write** |
| `getCategories()` | 1 query |
| `getPublicBundles()` | 1 query |

`syncExpiredPromotions` runs twice per render because both `getPublicCourses`
([data/course.ts:7](../data/course.ts#L7)) and `getActivePromotion`
([actions/promotions.ts:270](../actions/promotions.ts#L270)) call it. Each run is
2 reads plus an N+1 loop that issues one `coursePromotion.findFirst` per course
with a past `flashSaleEnd` ([actions/promotions.ts:86-108](../actions/promotions.ts#L86)).

And `getActivePromotion` **writes on a read path**:

```ts
// actions/promotions.ts:313-318
db.coursePromotion.update({
  where: { id: promotion.id },
  data: { impressions: { increment: 1 } },
}).catch(() => {});
```

One row update per page view of `/courses`, anonymous traffic included.

**`/courses/[courseId]`** is worse: `getCourseById` is called **twice per
request**, once in `generateMetadata` (line 25) and once in the page body (line
86). Next.js deduplicates `fetch`, not Prisma, and nothing wraps this in
`React.cache()`. Each of the two calls pulls:

```ts
// data/course.ts:95-125
tutor: { include: { user: true, Course: { where: { status: "PUBLISHED" } } } },
modules: { include: { lessons: { include: { quiz: true } }, resources: true } },
reviews: { where: { isPublic: true }, include: { user: true, reactions: { select: { type: true } } } },
enrollments: true,   // every enrollment row for the course, for a public page
```

`enrollments: true` with no `select` loads every enrollment row in full so the
page can count them. `where: { status: "PUBLISHED" }` and the `OR: [{id}, {slug}]`
lookup run against a `Course` model with **zero** `@@index`.

**`sitemap.ts`** is `force-dynamic` with 5 uncached database sections, including an
unbounded `db.tutor.findMany` that loads every tutor with their user row so it can
filter on a JSON preference in application code.

**`getPublicCourses`** ([data/course.ts:9-21](../data/course.ts#L9)) loads, for
every published course, every public review **with the reviewing user's full row**,
the full tutor and their user, all tags, and a count of enrollments. The result is
then mapped down to about 20 scalar fields, so most of what was transferred and
scanned is discarded.

### F6. Index coverage is thin in exactly the wrong places

**Where:** `prisma/schema.prisma`

I audited all 100 models for relation columns not covered as the leading column of
any index. 71 models have at least one unindexed foreign key. The ones on hot
paths:

| Table | Missing | Query that pays for it |
|---|---|---|
| `notifications` | `userId`, `(userId, createdAt)` | the 30s poller, F2 |
| `transactions` | everything; **0 `@@index`** | `status + createdAt` in the payment sweep, `transactionId` in verify, `userId` in wallets, `courseId` in earnings |
| `courses` | `status`, `tutorId`, `categoryId`, `ownerId`, `creatorId` | `/courses`, `sitemap.ts`, every tutor dashboard |
| `enrollments` | `courseId` | `_count: { enrollments: true }` per course on `/courses` |
| `transaction_line_items` | `transactionId`, `courseId`, `tutorId` | admin finance, tutor earnings |
| `platform_events` | nothing, has 5 indexes | fine, but see F7 |

`enrollments` has only `@@unique([userId, courseId])`. A filter on `courseId` alone
cannot use that index, because `userId` is the leading column.

Why this lands on a compute bill rather than only as latency: Neon autoscales on
load, and the billed CU size is the average across the autoscaling range. A
sequential scan where an index seek would do raises the average size for the whole
awake window, so it multiplies the cost of every hour F1 to F5 keep the compute
awake.

### F7. Append-only tables with no retention policy

**Where:** `platform_events`, `blog_views`, `exam_events`, `notifications`

`POST /api/analytics/track`
([app/api/analytics/track/route.ts:91](../app/api/analytics/track/route.ts#L91))
inserts a row into `platform_events`, which carries 5 indexes to maintain per
insert, and calls `auth()` first. The route is deliberately public and
rate-limited at 300/IP/minute, which is the right call for carrier-grade NAT, but
it also means write volume is set by traffic and not by anything we control.
`POST /api/blog/view` does an `upsert` plus a `count` per blog post view.

No production code path deletes from any of these tables. The only `deleteMany`
calls are in `scripts/verify-*` test teardown. These tables grow without bound,
which inflates storage (billed continuously, awake or not), insert cost through
index maintenance, and the cost of every sequential scan from F6.

### F8. Query-per-iteration loops on dashboard paths

**Where:** [data/tutor-analytics.ts:182](../data/tutor-analytics.ts#L182)

```ts
for (let i = monthsBack - 1; i >= 0; i--) {
  const sum = await db.transaction.aggregate({
    where: { status: "COMPLETED", course: { tutorId: tutor.id }, createdAt: { gte: start, lt: end } },
    _sum: { tutorShareAmount: true },
  });
```

Six **sequential** aggregates, each joining `transactions` to `courses` on
`tutorId`, where neither `transactions.status`, `transactions.createdAt` nor
`courses.tutorId` is indexed. One `groupBy` with date truncation replaces all six.

Related, lower priority: `getAdminDashboardData`
([actions/admin-dashboard.ts:29](../actions/admin-dashboard.ts#L29)) issues 19
queries in one `Promise.all`, several of them unbounded `groupBy` over whole
tables (`enrollment` by `userId`, `enrollment` by `courseId, status`, `review` by
`courseId`, `course` by `tutorId`). It runs once per admin dashboard mount, not on
a timer, so it is a spike rather than a leak.

### F9. A 5-second poller on the mentorship session page

**Where:** [app/(root)/mentorship/session/[sessionId]/page.tsx:130](<../app/(root)/mentorship/session/[sessionId]/page.tsx#L130>)

```ts
const pollInterval = setInterval(loadSession, 5000);
```

Every 5 seconds, with no visibility check and no stop condition once the session
is live or finished. Each poll hits `/api/mentorship/session/[sessionId]`, which
calls `auth()` and queries the session. A student who leaves this tab open after a
session ends generates 12 requests a minute indefinitely. Much lower total volume
than F2 because few people are on this page, but it is the most aggressive
interval in the codebase.

The tutor exam monitor at
[exam-monitor-client.tsx:91](../components/pages/tutor/exams/exam-monitor-client.tsx#L91)
does `router.refresh()` every 15 seconds, which re-runs the whole server page.
That one is defensible: a live exam monitor needs fresh data and it is only open
during exams. It should get an auto-stop when no attempt is live.

---

## 4. Rough attribution

Treat these as orders of magnitude, not invoice lines. They assume the 5-minute
default autosuspend and that an awake hour is billed at the project's average
autoscaled size, which I could not read (section 2).

**Awake hours per day, with zero visitors:**

| Source | Wake-ups/day | Awake h/day |
|---|---|---|
| `exam-sweep` every 15 min | 96 | ~8.0 |
| `payment-sweep` every 30 min | 48, all inside an exam-sweep window | ~0 extra |
| **Floor** | | **~8.0** |

That is ~240 awake hours a month before anyone visits the site. Multiply by the
project's billed CU size for the CU-hrs: 60/month at 0.25 CU, 120 at 0.5 CU, 240
at 1 CU.

**Then add, and these overlap each other rather than stacking cleanly:**

| Source | Effect on awake time |
|---|---|
| One signed-in visible tab (F2) | continuous for as long as it is open |
| A dev day on the shared endpoint (F4) | continuous for the working day |
| Any authenticated session (F3) | continuous while someone is clicking |
| Crawler traffic on `/courses`, `/courses/*`, `/sitemap.xml` (F5) | keeps it awake whenever crawl rate exceeds 1 per 5 min |

Once F2 or F4 is in play on a given day, the sweeps in F1 cost nothing extra,
because the compute was already awake. **This is why fixing one thing in isolation
will not move the bill.** The compute has to be allowed to sleep by all of them or
by none.

F6 and F7 do not add awake hours; they raise the price of each one by driving the
autoscaler up. They are the second lever, not the first.

---

## 5. Suggested fixes

Ordered by cost reduction per unit of effort. Nothing here has been applied.

### 5.1 First, verify against the live database

The whole of section 3 is static analysis, and section 2 lists what that cannot
see. Before changing code, authorise the Neon MCP server, or run these in the Neon
SQL editor against `prod_db_v2`:

```sql
-- 1. Which indexes actually exist, given migrations and schema have diverged
select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public'
  and tablename in ('notifications','transactions','courses','enrollments',
                    'transaction_line_items','platform_events')
order by tablename, indexname;

-- 2. Where sequential scans are actually happening, and how big the tables are
select relname, seq_scan, seq_tup_read, idx_scan, n_live_tup,
       pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_stat_user_tables
order by seq_tup_read desc
limit 25;

-- 3. The actual top queries by total time. Needs pg_stat_statements enabled:
--    create extension if not exists pg_stat_statements;
select calls,
       round(total_exec_time::numeric, 1) as total_ms,
       round(mean_exec_time::numeric, 2) as mean_ms,
       rows,
       left(query, 160) as query
from pg_stat_statements
order by total_exec_time desc
limit 30;

-- 4. Append-only table growth, for F7
select 'platform_events' as t, count(*) from platform_events
union all select 'notifications', count(*) from notifications
union all select 'blog_views', count(*) from blog_views;
```

And in the Neon console, record: compute size, autoscaling min/max, autosuspend
setting, and the daily CU-hr chart. The shape of that chart settles everything. A
flat line near a constant value means F1 to F4. A spiky line that tracks business
hours means F5. A flat line that has been rising over months means F6 and F7.

Expected outcome: the top entry in query 3 should be the `notifications` select,
and `notifications` should appear high in query 2 with a large `seq_tup_read` and
`idx_scan` at or near zero. If it does not, F2 is wrong and this ranking needs
revisiting.

### 5.2 Let the sweeps skip the database (F1)

Highest-value change available, because it removes the floor.

Upstash Redis is already configured and in use for rate limiting
([lib/rate-limit.ts:3](../lib/rate-limit.ts#L3)). Use it as the wake-up gate:

- When an exam is published or an attempt starts, set a Redis key such as
  `exams:live` with a TTL covering the exam window plus the grace period. When a
  Paystack charge is initialised, set `payments:pending` with a TTL of the grace
  period.
- At the top of each sweep route, read that key. If it is absent, return
  `{ ok: true, skipped: true }` **without constructing a Prisma client or issuing
  a query**. Redis is not Neon, so a skipped tick costs no compute time.
- Keep the 15-minute cadence. It becomes free on quiet days and stays punctual
  when something is actually live.

This turns an ~8 h/day floor into roughly zero on a day with no exams and no
abandoned checkouts, while keeping the backstop guarantee the workflow comments
are careful to preserve. The sweeps stay idempotent, so a missed Redis key is
caught by the next tick after real activity sets it again.

Lower-effort fallback if the Redis gate is too much for now: move `exam-sweep` to
`*/30` and accept a 30-minute backstop, which halves the floor to ~4 h/day.
Strictly worse than the gate, and should be a stopgap.

Separately, drop `countDriftingWallets` from the per-tick path. It is a
reconciliation check, not a sweep step. Run it once a day, or move it into
`scripts/reconcile-wallets.ts`, which already exists.

### 5.3 Make the notification poller stop costing money (F2)

Three changes, in order of value:

1. **Add the index.** One line, and the single highest-value index in the
   codebase:

   ```prisma
   model Notification {
     // ...
     @@index([userId, createdAt])
     @@map("notifications")
   }
   ```

   Create it concurrently in production so it does not lock the table:
   `CREATE INDEX CONCURRENTLY "notifications_userId_createdAt_idx" ON "notifications" ("userId", "createdAt");`

2. **Raise the interval and back it off.** 30 seconds is 10x more often than the
   idle timer. Notifications here are enrollment confirmations, exam releases and
   mentorship alerts, none of which need sub-minute delivery. Move `POLL_INTERVAL`
   to 120 seconds, and add exponential backoff up to ~10 minutes after N
   consecutive empty polls, reset to the base interval on any user interaction or
   on `visibilitychange`. An idle tab then settles into a cadence longer than the
   5-minute timer and **stops holding the compute awake at all**, which is the
   entire point. `lib/notifications/poll-scheduler.ts` is the right place: it
   already owns the cadence and has tests.

3. **Longer term, stop polling.** The real fix is push. Upstash is already a
   dependency, and the Paystack webhook path shows the app can take inbound
   events. Server-sent events from a route that subscribes to Redis pub/sub takes
   the steady-state notification cost to zero queries.

### 5.4 Stop reading the user row on every `auth()` (F3)

The callback needs to notice a role change or a forced password reset reasonably
promptly. It does not need to notice within one page click. Stamp the token and
re-read on an interval:

```ts
// auth.ts, in callbacks.jwt
const REFRESH_MS = 5 * 60 * 1000;
const checkedAt = (token.checkedAt as number) ?? 0;
const mustRefresh =
  trigger === "signIn" || trigger === "update" || Date.now() - checkedAt > REFRESH_MS;

if (token.sub && mustRefresh) {
  const userActive = await db.user.findUnique({ /* unchanged */ });
  // ... unchanged role / mustChangePassword handling ...
  token.checkedAt = Date.now();
}
```

`trigger` is already destructured in the signature at
[auth.ts:110](../auth.ts#L110) and currently unused. This drops the cost from "one
query per `auth()` call across 258 call sites" to "one query per user per 5
minutes", a reduction of roughly 50 to 100x for an active session.

Note the interaction with 5.3: at a 5-minute refresh the token read no longer
resets the idle timer on its own either.

Two companions:

- Pass `refetchOnWindowFocus={false}` to `SessionProvider` at
  [app/layout.tsx:143](../app/layout.tsx#L143). The session is already seeded from
  the server on every render, so the focus refetch buys nothing.
- Move the admin name-normalisation write ([auth.ts:119-131](../auth.ts#L119)) out
  of the jwt callback. It is a one-time data fix sitting on a read path. Put it in
  the admin area, or in a script.

### 5.5 Give development its own compute (F4)

In the Neon console, create a branch for development. A Neon branch gets its own
compute endpoint, so its CU-hrs are separate, it can sleep on its own schedule,
and dev traffic stops touching the endpoint that serves production. Then:

- Put exactly **one** `DATABASE_URL` in `.env`, pointing at the dev branch.
- Put the production URL in the hosting environment only, never in a local file.
- Delete the duplicate assignment so which database is live is not decided by
  dotenv precedence.
- Add `channel_binding=require` to the dev URL to match production.

### 5.6 Cache the public pages, and stop writing on read paths (F5)

Smallest to largest:

1. **Remove the duplicate `getCourseById` call.** Wrap it in React's `cache()` so
   `generateMetadata` and the page body share one result. This halves the cost of
   every course page view for a one-line change:

   ```ts
   // data/course.ts
   import { cache } from "react";
   export const getCourseById = cache(async (courseId: string) => { /* unchanged */ });
   ```

   The same wrapper is worth applying to `getPublicCourses`, `getCategories` and
   `checkUserEnrollment`.

2. **Deduplicate `syncExpiredPromotions`.** It runs twice per `/courses` render.
   It is a maintenance job, not a read concern: move it into the payment sweep, or
   its own daily tick, and delete both call sites at
   [data/course.ts:7](../data/course.ts#L7) and
   [actions/promotions.ts:270](../actions/promotions.ts#L270). While moving it, fix
   the N+1 at [actions/promotions.ts:86-108](../actions/promotions.ts#L86): the
   per-course `findFirst` can be one `findMany` with `courseId: { in: [...] }`.

3. **Stop the impression write on page render.** Increment a Redis counter in
   `getActivePromotion` instead, and flush it to `coursePromotion.impressions`
   from the sweep. A view counter does not need to be transactional.

4. **Trim the over-fetching.** `getPublicCourses` discards most of what it loads.
   Replace `reviews: { include: { user: true } }` with an `_avg` via `groupBy`, or
   with `reviews: { select: { rating: true } }`, since only `getAverageRating`
   consumes them. In `getCourseById`, replace `enrollments: true` with
   `_count: { select: { enrollments: true } }`.

5. **Add caching.** `/courses`, `/courses/[courseId]`, `/bundles/[slug]`,
   `/courses/category/[slug]` and `sitemap.ts` are public, identical for every
   visitor, and change rarely. Replace `force-dynamic` with a `revalidate` (300s
   for listings, 3600s for the sitemap) and revalidate on publish with
   `revalidateTag`. Note the blocker: the root layout's `auth()` and `headers()`
   calls currently make every route dynamic regardless, so this needs the nonce
   and session reads pushed down out of the root layout first. That is the largest
   item in this document and the one to schedule rather than squeeze in. Check
   `node_modules/next/dist/docs/` for this Next version's caching API before
   writing it; the conventions here differ from older releases.

### 5.7 Index the hot tables (F6)

After confirming against 5.1 which of these already exist. All as
`CREATE INDEX CONCURRENTLY` in production.

```prisma
model Notification { @@index([userId, createdAt]) }            // F2, do this first
model Transaction  { @@index([status, createdAt])
                     @@index([transactionId])
                     @@index([userId, createdAt])
                     @@index([courseId]) }
model Course       { @@index([status, publishedAt])
                     @@index([tutorId])
                     @@index([categoryId]) }
model Enrollment   { @@index([courseId, status]) }
model TransactionLineItem { @@index([transactionId])
                            @@index([tutorId])
                            @@index([courseId]) }
```

Then work down the 71-model list for the remaining foreign keys. Unindexed foreign
keys also make `onDelete: Cascade` expensive, which this schema uses widely.

While doing this, reconcile `prisma/migrations/` with `schema.prisma` so the index
set is reviewable in git rather than living only in whatever `db push` last did.
`docs/prod-migration-runbook.md` already exists and is the right place to record
the procedure.

### 5.8 Add retention to the append-only tables (F7)

Add a daily step to the sweep, or a separate daily workflow, that deletes:

- `platform_events` older than 90 days, after rolling up whatever the admin
  analytics page needs into a summary table;
- `blog_views` older than 180 days, keeping per-post counts as a scalar;
- `exam_events` older than 1 year, or after results are released and the appeal
  window has closed;
- `notifications` that are read and older than 90 days.

Delete in batches with `take` so a single statement does not hold a long
transaction. This shrinks storage (billed continuously), shrinks index maintenance
on every insert, and shrinks the cost of the scans in F6.

### 5.9 Fix the remaining loops and pollers (F8, F9)

- Replace the 6-iteration loop at
  [data/tutor-analytics.ts:182](../data/tutor-analytics.ts#L182) with one `groupBy`
  over a 6-month range, bucketed by month.
- Give the mentorship session poller the treatment the notification poller already
  has: a visibility check, a longer interval (15s is ample for "has the tutor
  started"), and a stop condition once `isSessionLive` is true or the end time has
  passed.
- Give the exam monitor's `router.refresh()` an auto-stop when no attempt is live.
  The 15s cadence is correct while an exam is running.

---

## 6. Suggested order of work

Sequencing matters more than usual here, because of the overlap noted in section
4: the compute only sleeps when nothing is waking it, so partial fixes show no
saving on the bill and look like failures.

| Step | Items | Effort | Expected effect |
|---|---|---|---|
| 0 | 5.1 verification | 1 hour | confirms or corrects this ranking |
| 1 | `notifications` index (5.3.1) | 10 min | cheapest real win, removes a seq scan from the most frequent query |
| 2 | Dev branch (5.5) | 30 min | removes dev traffic from the production meter |
| 3 | jwt refresh interval + `refetchOnWindowFocus` (5.4) | 1 hour | 50 to 100x fewer `users` reads per session |
| 4 | Poller interval + backoff (5.3.2) | 2 hours | lets an idle tab stop holding the compute awake |
| 5 | Redis gate on the sweeps (5.2) | half day | removes the ~8 h/day floor |
| 6 | Remaining indexes (5.7) | half day | lowers the autoscaled size of every awake hour |
| 7 | `React.cache()` + drop the double query + sync/impression moves (5.6.1-4) | half day | halves course-page cost |
| 8 | Retention (5.8) | half day | stops the slow upward drift |
| 9 | Root-layout refactor + ISR on public pages (5.6.5) | multi-day | takes crawler traffic off the database |

Steps 1 to 5 together are what should move 160 CU-hrs. Steps 1 to 4 are reversible
config and query changes. Step 5 is the structural one, and it is what turns a
database that cannot sleep into one that can.

Re-read the Neon daily CU-hr chart after step 5 and again after step 9, rather
than after each step. The overlap means intermediate readings will be misleading.
