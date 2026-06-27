# ProjectHub — Product Roadmap (Corrected & Re-Sequenced)

A multi-tenant **Business Operating System**: every company runs its projects,
people, inventory, and operations inside one isolated workspace — presented as a
**Google Cloud Console–style** platform where each capability is a "service" with
its own tools, settings, and documentation.

This document is the single source of truth for where the product is going and how
the work is split day by day. It is reviewed and updated as phases complete.

**Cadence:** one focused task per working day. Full scope targets ~5–6 months.
**Frontend:** rebuilt from scratch in a Google Cloud Console style (clean
blue/white, neutral surfaces, dense tables, light/dark).

> **Why this version exists.** A security, scale, QA, and product review of the
> codebase found the original phase order was backwards in four ways: (1) security/tenant
> isolation was parked in a final "hardening" phase — *after* 12 module UIs get
> rebuilt against an unenforced, copy-pasted `organization:` filter, and *before*
> any real HR/salary data is protected; (2) tests were last, even though the
> 12-module rebuild *is* a regression engine over a discipline-only isolation
> boundary; (3) scale fixes that are cheap-now-but-expensive-after-the-rebuild
> (Redis presence, token contract, scoping plugin, indexes, connection pool) were
> never locked early; (4) ~4 months of cosmetic re-skinning of 12 commodity
> modules was scheduled *before* the one thing competitors can't clone — the
> connected ledger (project labor cost, order margin) that the schema is already
> ~80% wired for. This roadmap fixes the sequencing without losing a single
> critical finding.

---

## 1. Vision

The console-style Business OS vision is correct and stays. Keep all five pillars.

| Pillar | What it means |
| ------ | ------------- |
| **Console-style UI** | Left navigation tree like Google Cloud Console: top-level **services**, expandable **sub-services**, each opening a focused workspace with its own tools, tables, and settings. |
| **Connected, not just collected** | The moat is the *spaces between* the modules. Time × payroll = project labor cost. Revenue − FEFO batch cost = order margin. The product's job is to **join** data the modules already store, not present 12 disconnected tools. |
| **Guided onboarding** | A multi-step, sliding sign-up that asks what the business needs, then provisions only the relevant services — and routes the user to the connected "aha" (live margin / labor-cost view), not to 12 empty CRUD screens. |
| **Need-based modules** | A company sees only the services it turned on. Gating must **degrade gracefully** so it never silently kills a cross-module feature (e.g. show hours if HR is off, cost if HR is on). |
| **Built-in guide** | Every service has in-app help (what it does, how to use it, rules) plus a full documentation site. |
| **100% real & safe** | No placeholder numbers, fake names, or dead buttons. And: no screen ships touching real HR/salary data until the security baseline below is green. |

---

## 2. Current state (what's done)

Already built and working (MERN, multi-tenant, role-based):

**Backend services (live API):**
`users` · `org` · `projects` · `tasks` · `hr` · `inventory` · `chat` ·
`reports` · `notifications` · `dashboard` · `contacts` (14 controllers).

**Frontend pages:** Landing, Dashboard, ProjectDetail, MyTasks, Members,
Activity, Analytics, Inventory, HR (Attendance/Employees/Leaves/Payroll), Join.

**Data entities:** 23 models. Reusable console components already shipped
(Button/Field/Card/Table/Badge/SidePanel) plus design tokens/theme — this was
correct, reusable infrastructure and stays.

**The engine exists — but with verified structural debt that dictates the new order:**

- **Tenant isolation is discipline-only.** `protect` loads `req.user` fresh and
  ~96 controller queries hand-add `organization: req.user.organization`. No
  Mongoose plugin, no helper, no test gate. One forgotten filter = cross-tenant
  breach.
- **Two confirmed cross-tenant HR write bugs.** `Payslip.index({ user, month })`
  and `Attendance.index({ user, date })` have **no `organization`** in the unique
  key (verified in `models/Payslip.js:35`, `models/Attendance.js:29`); the
  HR write filters omit org too.
- **NoSQL operator injection** is live (no `mongo-sanitize`; raw `email`/`token`
  into `findOne`).
- **Secrets at risk:** Firebase service-account key + `.env` baked into the Docker
  image; `backend/.env` and `frontend/.env` tracked in git.
- **Chat confidentiality is broken in transit** (org-wide plaintext fan-out) and
  its encryption key falls back to `JWT_SECRET` then the public constant
  `'dev-fallback-secret'` (verified `utils/messageCrypto.js:5`).
- **Scale landmines that are cheap now:** missing compound `{organization, …}`
  indexes, no Mongo pool config (dead `config/db.js`), unbounded report `.find()`,
  in-memory per-process presence `Map`, per-request `User.findById`.
- **The moat is half-wired and never joined:** `reportController.js:209` already
  aggregates `timeLogs.seconds` per user/task and *stops*; `monthlySalary` sits in
  HR; `BatchInventory` has **no `unitCost`** (verified `models/BatchInventory.js`),
  so `PurchaseOrder.unitCost` is dropped on receive and order margin is currently
  impossible.

So the engine exists — this roadmap makes it **safe, scalable, tested, and
differentiated**, in that dependency order, while reshaping it into the console
product.

---

## 3. Corrected phase plan (re-sequenced)

Principle: **lock the irreversible things first** (security, isolation
enforcement, token contract, presence source-of-truth, indexes), **build the moat
before the cosmetic rebuild**, **weave tests in as a gate not a phase**, and
**defer the funnel polish (catalog UI, onboarding stepper) until there's an aha to
route to.** One day-sized task per working day.

---

### Phase 0 — Foundation & deploy readiness *(done)*
**Goal:** Backend/frontend split, Docker, env handling, reusable console
components + tokens, README, this roadmap.
**Why here:** It's the substrate. Done.

---

### Phase 1 — Console shell (the new UI frame) — *FINISH ONLY, then stop*
**Goal:** The app's new skeleton: console layout, service-tree sidebar, top bar,
breadcrumb, help drawer. No feature changes — the frame everything plugs into.
**Why here:** The shell is necessary infrastructure and the base components are
already built, so finishing the frame is cheap and unblocks every later screen.
But the shell is a re-skin — it adds zero capability and is **not** a reason to
proceed into a 12-module migration. Finish the frame, then go build value and
safety. **Do not migrate the 12 modules yet.**
**Key tasks (~1 day each):**
- Layout components (TopBar, SideNav, ContentShell, HelpDrawer) — skeleton.
- Service-tree config the sidebar reads (the catalog tree).
- SideNav: expand/collapse, active state, icons.
- TopBar: workspace name, global search (UI), notifications, account menu.
- Breadcrumb + page-header pattern (title + primary-action slot).
- HelpDrawer component (static content for now).
- Route existing Dashboard into the shell as "Overview".
- Responsive + light/dark + keyboard nav pass.
- Verify shell end-to-end (headless render, no regressions) and ship.

---

### Phase 2 — Security & Foundation Baseline — *NEW, the gate before real data*
**Goal:** Close every unauthenticated-to-cross-tenant chain, make tenant isolation
*enforced* (not discipline-only), fix secret hygiene, and stand up the testing
harness + the parameterized cross-tenant isolation suite that guards everything
after. Lock the cheap-now-expensive-later scale decisions here too.
**Why here (the core correction):** This was Phase 6. It must be Phase 2. Three
reasons converge: (a) the next phases write real money/HR logic and then rebuild
12 UIs — both churn the exact isolation surface that has *zero* automatic
enforcement; retrofitting enforcement and tests *after* means re-touching every
module and writing characterization tests against possibly-already-broken code.
(b) Several fixes (scoping plugin, token contract, presence source-of-truth,
indexes, pool config) are **cheap with 1 consumer now and expensive after the
rebuild bakes in assumptions**. (c) The product is meant to hold HR salaries —
in its current form it must not touch real salary data. This phase is the
non-negotiable launch gate. It is the longest phase; that is correct.

**Key tasks (~1 day each):**

*Block A — kill the cross-tenant chains (do first):*
- **NoSQL sanitization:** mount `express-mongo-sanitize` (or a `$`/`.`-key
  rejector) before routes; string-coerce `email`/`token`/id lookups in
  `userController` + `orgController` invite paths. Unit-test that `{"$gt":""}` in
  body/query/params is neutralized and invite-hijack is rejected. *(C1)*
- **Org-scope every HR query:** add `organization: req.user.organization` to all
  `findOne`/`findOneAndUpdate` in `hrController`; change Payslip/Attendance unique
  indexes to lead with `organization` (`{organization, user, month}` /
  `{organization, user, date}`); migrate existing rows. *(C2)*
- **Audit all 14 controllers** for missing org scope: grep every
  `findOne`/`findByIdAndUpdate`/`updateOne`/`deleteOne` on tenant models; confirm
  org in the filter; document exceptions. *(C2 / M2)*
- **Automatic tenant-scoping backstop:** a Mongoose plugin / `scopedQuery(req,
  Model)` helper that injects `organization` and **throws** if a tenant model is
  queried without it. Convert HR + chat first. This is the structural fix that
  stops the whole bug class from recurring during the rebuild. *(M2 / scale #9)*

*Block B — secrets & auth hardening:*
- **Docker/secret hygiene:** load Firebase creds from env/secret (not `COPY . .`);
  fix `.dockerignore` (`config/*firebase-adminsdk*.json`, `.env*`, `*.pem`);
  `git rm --cached backend/.env frontend/.env`; add `.env.example`; gitignore
  `.env`/`.env.*`. *(C3 / C4)*
- **Rotate** the Firebase service-account key and generate a real 256-bit
  `JWT_SECRET` (the committed placeholder is burned). Document a secret runbook.
  *(C3 / C4)*
- **Per-conversation Socket.io rooms:** join sockets to `conv:<id>` by validated
  membership; emit message bodies there, never to the `org:` room. Kills the
  org-wide plaintext fan-out. *(H1)*
- **Dedicated `MESSAGE_SECRET` + fail-fast:** require it; remove the `JWT_SECRET`
  and `'dev-fallback-secret'` fallbacks; boot-time assert prod secrets exist and
  aren't placeholders. *(H2)*
- **JWT `tokenVersion` revocation:** add field to User, embed in token, check in
  `protect` + socket auth, bump on logout/password-change/role-revoke; add logout
  endpoint. Near-free given the existing per-request user reload, and it makes
  offboarding actually cut access. **Decide the access/refresh-token contract now**
  even if refresh ships later — the token shape must be frozen before the rebuild
  bakes assumptions into 12 UIs. *(H3 / scale #6 — LOCK)*
- **Global authenticated rate limiting + report caps:** per-user limiter
  (~300/min); tighter caps on `/reports/*` and aggregates; enforce pagination;
  Redis-backed store for multi-node. *(H4)*

*Block C — testing harness + the one test that lets you sleep:*
- **Stand up the harness:** Vitest + Supertest + mongodb-memory-server; `npm test`
  script; auth helper that seeds org+user and mints a JWT. *(QA P0 enabler)*
- **CI test gate:** add a `test` job to GitHub Actions and **block the Firebase
  deploy on failure** (today CI only deploys). *(QA / M7)*
- **★ Parameterized cross-tenant isolation suite ★** — *the single highest-leverage
  test, write it before any module rebuild.* Seed Org A + Org B with a row in each
  major collection; drive a `[method, path, model]` table so all 12 modules are
  covered by one body; assert Org B's user sees **none** of Org A's rows and
  by-id fetches 403/404. Adding a module = adding a table row. *(M7 / QA §5)*
- **Auth/RBAC suite:** `protect` rejects missing/invalid/expired/user-not-found;
  `requireRole` blocks Member<Manager<Admin<Owner; ownership checks on
  update/delete. *(QA P0)*
- **Input-safety suite:** operator-injection payloads rejected on auth + key list
  endpoints; CSV formula-injection guard stays green. Pair with installing Zod
  per-route schemas (bound numeric salary fields — no negative/NaN). *(M5 / QA P1)*

*Block D — scale-locks that are cheap NOW, ruinous after the rebuild:*
- **Compound indexes for all hot models** (ESR-ordered) + a `syncIndexes()`
  migration with `background: true` builds. At minimum:
  `Task {project,status}`, `{organization,assignedTo,status}`,
  `{organization,createdAt:-1}`, `{organization,'timeLogs.user'}`;
  `Project {organization,members}`, `{organization,createdAt:-1}`;
  `Activity {organization,createdAt:-1}`;
  `Order/Return/StockLedger/PurchaseOrder {organization,createdAt:-1}` and
  `{organization,status}`; `Comment {task,createdAt}`;
  `BatchInventory {organization,product}`. Verify with `explain()`. *(scale #1 / M1)*
- **Mongo connection pool config:** explicit `maxPoolSize`/`minPoolSize`/
  `serverSelectionTimeoutMS`/`socketTimeoutMS`; delete dead `config/db.js`;
  document the invariant `instances × maxPoolSize ≤ Atlas tier limit`. *(scale #4 — LOCK)*
- **Bound + stream all report queries:** add `.limit()` + cursor streaming to
  `ordersReport`/`returnsReport`/`stockReport`/`attendanceReport`/`payrollReport`;
  hard-cap populated rows (~50K); the rate limiter from Block B covers DoS. *(scale #5)*
- **Redis-backed presence (LOCK the source of truth):** move the per-process
  presence `Map` to Redis (`SADD presence:{org} {user}` + TTL/heartbeat, or
  `fetchSockets()` across nodes); make `onlineUserIds` async and update its
  consumers **now while there's one consumer**. *(scale #2 — LOCK)*
- **TTL/retention indexes on Activity + Notification** (e.g. 90/180 days) — set
  before the collections balloon; pruning later is an expensive batch job. *(scale #10 — LOCK)*

**Exit criteria (must all be green before Phase 3):** isolation suite + auth/RBAC
+ injection tests passing in CI as a required check; the 9 non-negotiable
security items below done; scoping plugin live; token contract frozen; presence on
Redis; indexes + pool config deployed.

---

### Phase 3 — Connected Value (the moat) — *NEW, the differentiator before the re-skin*
**Goal:** Light up the cross-module joins the schema already half-stores: project
labor cost, per-order/per-product gross margin, and a connected "Business Pulse"
overview. Add the `enabledServices` data primitive (field only). Write the money-
math unit tests **as you build**, not after.
**Why here (the second core correction):** This is the only thing a competitor
can't clone in a weekend, and it's days of work, not months — the halves sit in
adjacent files and have never been joined. Building it *before* the 12-module
migration matters for two reasons: (a) opportunity cost — every day re-skinning a
commodity table is a day the "whoa" feature doesn't exist; (b) **design order** —
if you freeze 12 standalone workspaces first, you have to retrofit cross-module
surfaces (a Profitability view, a Project-Cost panel) into a layout that wasn't
built to hold them. Design the connective tissue first. Now it's also *safe* to
write this money code, because Phase 2 gave you the isolation gate and the harness.
**Key tasks (~1 day each, with tests written alongside):**
- **`enabledServices` field** on Organization + safe defaults (the data primitive
  only — **not** the toggle UI; that's deferred). Design gating to **degrade
  gracefully** so a tenant with Projects-but-not-HR still gets value (hours, not
  cost). *(product §4)*
- **Project Labor Cost (zero schema change):** join `timeLogs.seconds × monthlySalary`
  in `reportController`; add an hourly-rate / standard-month config on
  Organization; surface a "Cost" column on projects + per-project report.
  **+ unit tests for the labor-cost function.** *(product 🥇)*
- **`unitCost` on `BatchInventory`** (schema add) + carry `PurchaseOrder.unitCost`
  → batch on PO-receive. *(product 🥈)*
- **Stamp `costAtSale`** into each `Order.batchBreakdown` line at FEFO deduction
  time (`orderController` ~L141) — stamp at sale, never recompute later, or
  restocks/returns corrupt historical margin. **+ FEFO costing unit tests.** *(product 🥈)*
- **Gross-margin endpoint** (per-order, per-product, per-period) + Reports export.
  **+ margin-math unit tests.** *(product 🥈)*
- **Business Pulse overview:** rewrite `getHome` from disconnected tiles into
  connected P&L-shaped numbers — Revenue / COGS / **Gross margin %** / labor burn.
  Same query cost, the screen you demo. *(product 🥉)*
- **End-to-end verify** on a real seeded workspace.

> Note: the ~15 focused money-math tests written here are the one place zero tests
> is genuinely dangerous independent of security — a FEFO costing bug tells a
> customer's accountant the wrong profit.

---

### Phase 4 — Service workspaces (the console migration) — *now safe and worth it*
**Goal:** Re-home each existing module into the console shell with consistent
tables, filters, side panels, empty-states, and help — **and** wire each module's
cross-module hook (margin on Orders, cost on Projects) and `enabledServices`
gating. One module per 1–2 days.
**Why here:** The migration is real work but it's a re-skin; it belongs *after*
isolation is enforced and tested (so the rebuild can't silently leak), *after* the
token/presence/index contracts are frozen (so you don't re-touch 12 UIs), and
*after* the moat exists (so each workspace can expose its connected surface instead
of being designed as a standalone box). This is the "regression engine" phase —
the isolation suite from Phase 2 is what makes it survivable.
**Phase-4 rule (non-negotiable):** *a module isn't "rebuilt" until its
characterization test ships the same day.* Each module's task ends with isolation +
happy-path + its key invariant:
- **Inventory** → FEFO deduct order + low-stock auto-reorder trigger + ledger
  balance + (now) batch-cost lineage.
- **HR** → payroll/payslip totals + leave-approval RBAC + PII not leaked cross-org.
- **Chat** → AES-256-GCM encrypt/decrypt round-trip + tampered ciphertext rejected
  + per-conversation room scoping.
- **Reports** → CSV formula-injection guard + bounded/streamed output.
- **Projects/Tasks** → kanban move + subtask + recurring generation + comment
  scoped to org + labor-cost surface.
- **Contacts, Orders, Returns, Transfers, Purchase Orders, Notifications,
  Dashboard** → isolation + one invariant each.
**Order:** Projects → Tasks → Inventory → HR → Insights → Communication →
Directory → Administration.
**Scale during/after this phase (SOON):** Redis user-cache in `protect` (kill the
per-request `User.findById`, version-aware invalidation); BullMQ queue for
email + notification fan-out (move SMTP off the request path); close the
`createProduct` RBAC gap. *(scale #3, #7 / H5)*

---

### Phase 5 — Services catalog UI + Guided onboarding — *deferred to here on purpose*
**Goal:** The "Services" admin screen (catalog grid + enable/disable toggles) and
the multi-step sliding sign-up (account → company → pick modules → role/team →
goals), landing the user on a tailored, *connected* Overview.
**Why here (the third correction):** These are funnel/conversion polish for a
product that, until Phase 3, had no aha to convert toward. A 6-task onboarding
stepper built before the differentiator would route users to 12 commodity modules
— wasted. The `enabledServices` *field* already shipped in Phase 3; only the toggle
UI and the stepper wait. Now onboarding can do its real job: route a distributor
to their live margin dashboard.
**Key tasks (~1 day each):**
- Services admin screen: catalog grid, enable/disable, Owner/Admin-gated API.
- Route/page guards for disabled services (graceful "enable this service"),
  honoring graceful degradation.
- Stepper component (sliding steps, progress, back/next, validation).
- Steps: account → company (size/industry) → pick modules (maps to
  `enabledServices`, smart defaults per industry) → role/invite team → goals.
- Wire finish → create org + enable services + land on the connected Overview;
  seed nothing fake.
- Test: onboarding provisions only chosen modules; disabled-module endpoints 403;
  core flow register→org→invite→accept scoped to org. Verify + ship.

---

### Phase 6 — In-app guide + documentation site
**Goal:** Per-service help wired into the help drawer + a standalone docs site
(getting started, each service, roles & rules, FAQ).
**Why here:** Docs describe the finished, connected product — writing them earlier
means rewriting them. Add the thin frontend test layer here too: Playwright smoke
(login + load one rebuilt workspace + create one record) and Vitest+RTL (shell
renders the service tree, login validation) — worthwhile only now that the shell
and workspaces are stable.

---

### Phase 7 — Hardening & launch
**Goal:** The *additive* hardening that genuinely belongs last — performance under
load, accessibility, and the deeper security staging.
**Why here:** These are defense-in-depth on top of an already-safe, already-tested
product — not the first line of defense (that moved to Phase 2).
**Key tasks:**
- Performance/load (k6), accessibility (axe), error/empty-state sweep.
- **Dashboard manager-summary cache** in Redis (60–120s TTL); denormalize
  per-user time-tracking counters; async/queued large CSV exports. *(scale #8, #11–13)*
- **Staged security:** CSP + CORS prod-gating + token-storage review; append-only
  security audit log (role changes, payslip generate/pay, member removal, failed
  auth); 2FA + account lockout + refresh-token rotation; field-level PII
  encryption for HR beyond chat. *(M3 / M4 / M6 / H3 staging)*
- Seed/demo workspace; deploy (frontend → Firebase, backend → container host);
  archive Message/StockLedger cold storage when a tenant's data forces it.

---

## 4. Security baseline checklist (must-do before live, ranked)

These nine ship in Phase 2 and **gate** any real HR/salary data. Ranked by blast
radius × likelihood.

1. **NoSQL sanitization + string-coerce auth/lookups** — closes unauthenticated
   cross-tenant login + invite-hijack. *(C1)*
2. **`organization` on every HR query + fix Payslip/Attendance unique indexes** —
   closes the two confirmed cross-tenant HR write bugs. *(C2)*
3. **Firebase key out of the image + `.dockerignore` fix + rotate key** — closes
   full social-auth compromise. *(C3)*
4. **Untrack `.env` + generate a real `JWT_SECRET`** — defuses the loaded gun. *(C4)*
5. **Per-conversation Socket.io rooms** — stop org-wide plaintext chat fan-out;
   restores at-rest encryption's value in transit. *(H1)*
6. **Dedicated `MESSAGE_SECRET` + remove insecure fallbacks** — decouple auth from
   chat confidentiality; kill the public-constant fallback. *(H2)*
7. **JWT `tokenVersion` revocation + logout** — offboarding actually cuts access. *(H3)*
8. **Automatic org-scoping plugin/helper (throws if unscoped)** — makes the whole
   bug class impossible to reintroduce during the rebuild. *(M2)*
9. **Parameterized tenant-isolation test suite as a required CI check** — the only
   thing that keeps discipline-based isolation from silently breaking across 12
   module rewrites. *(M7)*

**Pulled forward (cheap, high value, also in Phase 2):** global authenticated rate
limiting + report caps *(H4)*; Zod validation with bounded salary numerics *(M5)*.
**Staged into Phase 7:** CSP/cookie-auth *(M3)*, CORS prod-gating *(M4)*, audit log
*(M6)*, 2FA/lockout/refresh rotation, field-level PII encryption.

---

## 5. Scale decisions to lock in now vs defer

**LOCK NOW (Phase 2 — cheap now, expensive after the 12-module rebuild bakes in
assumptions):**

1. **Presence source of truth = Redis** (not the in-process `Map`) — changes the
   `onlineUserIds` contract every module uses; change it with 1 consumer, not 5.
2. **Token contract** — add `tokenVersion` now and decide the access/refresh split;
   Phase 4 UIs bake in token-lifetime assumptions.
3. **Enforced tenant-scoping pattern** (plugin/base helper) — must precede the
   rebuild or you re-touch all 12 modules.
4. **Atlas connection invariant** — explicit pool config + documented
   `instances × maxPoolSize ≤ tier limit`; delete dead `config/db.js`.
5. **Compound `{organization, …}` indexes** — instant builds while collections are
   small; under load it's real-money downtime to discover.
6. **TTL/retention on Activity + Notification** — set before they balloon; pruning
   later is an expensive batch job.
7. **Bounded + streamed report queries** — one big tenant's unbounded `.find()`
   OOMs the shared instance today.

**DO SOON (Phase 4 / under early load):**
- Redis user-cache in `protect` (kill per-request `User.findById`, version-aware).
- BullMQ queue for email + notification fan-out (SMTP off the request path).

**DEFER (Phase 7 / until a tenant actually hurts):**
- Dashboard manager-summary Redis cache (60–120s TTL).
- Denormalized per-user time-tracking counters.
- Async/queued large CSV exports.
- Archive Message/StockLedger to cold storage + time-bucketing.

---

## 6. Testing strategy (what, framework, woven in)

**The reframe:** tests are not a phase — they are a **gate**. Test-last is
specifically wrong here because (a) the 12-module rebuild *is* a regression engine,
and (b) the one invariant you can never break — tenant isolation — has zero
automatic enforcement and is one forgotten filter from a breach.

**Framework (one runner, this stack):**
- **Vitest** — single runner, backend + frontend (Vite-native, no second runner).
- **Supertest** — in-process Express HTTP integration; ~80% of value lives here
  (isolation + RBAC are HTTP-level assertions).
- **mongodb-memory-server** — real Mongoose queries against ephemeral Mongo; no
  Atlas/Docker in CI; isolation tests must hit real query behavior, not mocks.
- **Playwright** — a *tiny* E2E sliver (login + one workspace smoke), deferred to
  Phase 6 once the shell is stable.
- **React Testing Library + Vitest** — sparingly, after the shell solidifies.
- Skip for now: Jest (no reason to run two runners), Cypress, k6 (Phase 7),
  contract testing (no external consumers).

**Priority order (solo dev, 1 task/day):**
| Pri | What | Type |
|----|------|------|
| **P0** | Tenant isolation — every list/read refuses another org's rows | Supertest integration |
| **P0** | Auth/RBAC — `protect`, `requireRole`, ownership checks | Integration |
| **P1** | Money/stock — FEFO order, auto-reorder, ledger math, payroll/labor-cost/margin totals | Unit + integration |
| **P1** | Input safety — NoSQL operator injection, CSV formula-injection | Integration + unit |
| **P2** | Critical flows — register→org→invite→accept; project→task→kanban→comment | Integration |
| **P2** | Encryption round-trip — Message AES-256-GCM, tampered ciphertext rejected | Unit |
| **P3** | Frontend smoke — shell renders, login, one workspace loads | Component / E2E |

Deliberately **low priority:** pixel-perfect UI, every CRUD field, analytics
widgets — they break loudly; don't spend the daily task there.

**How it's woven in (the mechanism that makes it a gate):**
1. Harness stood up in **Phase 2** (Vitest + Supertest + mongodb-memory-server +
   JWT auth helper).
2. **CI test job blocks the Firebase deploy** on failure (today CI only deploys).
3. The **parameterized cross-tenant isolation suite is the first real test**,
   green **before** any module rebuild; it's table-driven so adding a module = a
   table row → 96-call-site coverage without 96 tests.
4. **Money-math unit tests written *as* Phase 3 builds** labor-cost/COGS/margin —
   the one place zero tests is dangerous independent of security.
5. **Phase-4 rule:** a module isn't "rebuilt" until its isolation + invariant test
   ships the same day — spreads the 12 module tests across the rebuild and locks
   behavior at the moment you best understand it.
6. The isolation suite is the guardrail that later makes the
   auto-enforcement-plugin refactor safe (prove the leak surface with tests first,
   then refactor toward enforcement).

---

## 7. Differentiation features (the cross-module moat) and where they slot

The shell is table stakes — it doesn't make this list. The moat is the connected
ledger, and the schema is ~one `unitCost` field away from it.

| # | Feature | Why it's defensible | Slot |
|---|---------|--------------------|------|
| 1 | **Project labor cost** (`timeLogs.seconds × monthlySalary`) | SMB PM tools deliberately don't touch payroll; the single-workspace model makes it natural. **Zero schema change** — `reportController.js:209` already aggregates seconds and stops. | **Phase 3** (first, cheapest "whoa") |
| 2 | **Per-order / per-product gross margin** (revenue − FEFO batch cost) | Requires the connected PO→Batch→Order lineage you already have 80% of; hard to bolt on later. Needs `unitCost` on `BatchInventory` + `costAtSale` stamped at deduction. | **Phase 3** |
| 3 | **Connected "Business Pulse" overview** (Revenue / COGS / Margin% / labor burn) | Turns 5 modules of disconnected tiles into one P&L story — the sales demo. Same query cost as today's `getHome`. | **Phase 3** |
| 4 | **Cross-module audit/lineage** ("this order consumed batch B123 from PO-44, supplier X") | Trust + traceability; emerges almost free from #2's stamped lineage. | **Phase 6** (mostly UI over existing data) |

**Guardrail:** `enabledServices` gating must **degrade gracefully** — show hours if
HR is off, cost if HR is on — so modularity never silently kills the very
cross-module features that are the point. Surfaces for #1–#3 are designed in
Phase 3 and *exposed* by each workspace in Phase 4 — which is exactly why the moat
precedes the migration.

---

## 8. Working agreement + open decisions

**Working agreement:**
- One phase at a time; one day-task at a time; **verify before moving on**.
- **No screen that touches real HR/salary data ships before the Phase-2 security
  baseline is green** (the nine ranked items + CI isolation gate).
- **A module isn't "done" until its isolation + invariant test ships the same day.**
- Every tenant-scoped query goes through the scoping helper; raw unscoped queries
  on tenant models fail the CI grep/test.
- Money math (labor cost, COGS, margin) ships with its unit tests in the same task.
- Secrets never enter git or the Docker image; `.env.example` is the only committed
  env file; every change keeps the app runnable and free of placeholder content.
- This file is updated at the end of each phase to reflect reality.

**Open decisions (confirm as we go):**
- **Access/refresh token split:** ship refresh-token rotation now or accept a
  short-lived access token + `tokenVersion` revocation only? (Contract must be
  frozen in Phase 2 regardless.)
- **Atlas tier & max instances** → sets `maxPoolSize` and the documented
  connection invariant.
- **Presence implementation:** Redis `SADD`+TTL set vs. on-demand
  `fetchSockets()` across nodes (both correct; pick one in Phase 2).
- **Standard monthly hours/seconds** used to convert `monthlySalary` → hourly rate
  for labor cost (per-org config? global default?).
- **Industry → default-modules mapping** for onboarding smart defaults.
- **Retention windows** for Activity / Notification TTL indexes (90 vs 180 days).
- **Docs site host** (in-repo static vs. separate) — decide before Phase 6.
- **Per-org message-encryption keys** (derive per-org vs. single `MESSAGE_SECRET`)
  — single secret is the Phase-2 baseline; per-org is a Phase-7 enhancement.
- Visual identity: exact palette/typography for the console (start neutral, refine).