# ProjectHub — Product Roadmap

A multi-tenant **Business Operating System**: every company runs its projects,
people, inventory, and operations inside one isolated workspace — presented as a
**Google Cloud Console–style** platform where each capability is a "service" with
its own tools, settings, and documentation.

This document is the single source of truth for where the product is going and how
the work is split day by day. It is reviewed and updated as phases complete.

**Cadence:** one focused task per working day. Full scope targets ~5–6 months.
**Frontend:** rebuilt from scratch in a Google Cloud Console style (clean
blue/white, neutral surfaces, dense tables, light/dark).

---

## 1. Vision

| Pillar | What it means |
| ------ | ------------- |
| **Console-style UI** | Left navigation tree like Google Cloud Console: top-level **services**, expandable **sub-services**, each opening a focused workspace with its own tools, tables, and settings. |
| **Guided onboarding** | A multi-step, sliding sign-up that asks what the business needs, then provisions only the relevant services. The rest can be enabled later from a "Services" catalog. |
| **Need-based modules** | A company sees only the services it turned on. An Owner can browse the full catalog and enable more at any time. |
| **Built-in guide** | Every service has in-app help (what it does, how to use it, rules) plus a full documentation site. |
| **100% real** | No placeholder numbers, fake names, or dead buttons. Every screen reflects real data and every control does something. |

---

## 2. Current state (baseline)

Already built and working (MERN, multi-tenant, role-based):

**Backend services (live API):**
`users` · `org` · `projects` · `tasks` · `hr` · `inventory` · `chat` ·
`reports` · `notifications` · `dashboard` · `contacts`

**Frontend pages:** Landing, Dashboard, ProjectDetail, MyTasks, Members,
Activity, Analytics, Inventory, HR (Attendance/Employees/Leaves/Payroll), Join.

**Data entities:** 23 models covering projects, tasks, org, HR, inventory
(products, batches, stock ledger, orders, returns, transfers, purchase orders),
contacts, chat, notifications.

So the **engine** exists. This roadmap reshapes it into a console-style product
with guided onboarding, a services catalog, and full documentation.

---

## 3. Service catalog (the "tree")

Top-level services and the sub-services / tools inside each. This becomes the
sidebar navigation and the onboarding checklist.

```
Workspace
├── Overview                 home dashboard, recent activity
├── Projects
│   ├── Projects             list, create, members, status
│   ├── Tasks                board + list, priorities, labels, subtasks
│   ├── Kanban               drag-and-drop columns
│   ├── Time Tracking        start/stop timers, per-task hours
│   └── My Tasks             cross-project assigned work
├── People (HR)
│   ├── Employees            profiles, roles, departments
│   ├── Attendance           check-in/out, daily log
│   ├── Leave                requests, approvals
│   └── Payroll              payslips, monthly runs
├── Inventory
│   ├── Products             catalog, SKU, pricing, reorder level
│   ├── Locations            warehouses
│   ├── Stock                batches, FEFO, ledger
│   ├── Purchase Orders      supplier in-flow, auto-reorder
│   ├── Orders               customer fulfilment, revenue
│   ├── Returns              restock / damage
│   └── Transfers            warehouse-to-warehouse
├── Directory
│   └── Contacts             customers + suppliers
├── Communication
│   ├── Chat                 encrypted conversations
│   └── Notifications        per-user bell, email
├── Insights
│   ├── Dashboard            role-aware summary
│   ├── Analytics            charts, trends
│   └── Reports              CSV exports (orders, time, payroll, stock...)
└── Administration
    ├── Members & Roles      invites, RBAC
    ├── Organization         workspace settings
    └── Services             enable/disable modules (the catalog)
```

Each leaf gets: a workspace screen, settings, and an in-app help panel.

---

## 4. Design language (Google Cloud Console–inspired)

- **Top bar:** workspace switcher, global search, help, notifications, account.
- **Left nav:** collapsible service tree; pinned/recent services; sub-items expand.
- **Content area:** breadcrumb, page header with primary action, data tables with
  filters, side panels for create/edit, empty-states that explain the service.
- **Right help drawer:** "About this service", "How to use", "Rules", links to docs.
- **Look:** clean, dense, neutral surfaces; clear hierarchy; light/dark; accessible.

---

## 5. Phased plan (month by month)

Each phase is ~2–4 weeks and broken into day-sized tasks (Section 6). Dates are
relative to the phase start; we move to the next phase only when the current one
is verified and shipped.

### Phase 0 — Foundation & deploy readiness  *(done / in progress)*
- Backend/frontend split, Docker, env handling, scale-ready config. ✅
- Remove placeholder/marketing data. ✅
- This roadmap. ◀ current

### Phase 1 — Console shell (the new UI frame)
The app's new skeleton: console layout, service-tree sidebar, top bar, breadcrumb,
help drawer. No feature changes — just the frame that everything else plugs into.

### Phase 2 — Services catalog + enable/disable
A "Services" admin screen and an `enabledServices` field per organization. The
sidebar shows only enabled services; Owners can enable/disable from the catalog.

### Phase 3 — Guided onboarding (multi-step sliding sign-up)
Replace the single register form with a stepper: account → company (size/industry)
→ pick modules → role/team → goals. On finish, provision the chosen services and
drop the user into a tailored Overview.

### Phase 4 — Service workspaces, polished one by one
Re-home each existing module into the console shell with consistent tables,
filters, side panels, empty-states, and a help panel. Order: Projects → Tasks →
Inventory → HR → Insights → Communication → Directory → Administration.

### Phase 5 — In-app guide + documentation site
Per-service help content wired into the help drawer, plus a standalone docs site
(getting started, each service, roles & rules, FAQ).

### Phase 6 — Hardening & launch
Accessibility, performance, error/empty states everywhere, end-to-end tests,
seed/demo workspace, deploy (frontend → Firebase, backend → container host).

---

## 6. Day-by-day breakdown

Tasks are sized to ~one working session. We tick them off as we go and keep this
list honest (no task is "done" until it's verified).

### Phase 1 — Console shell
- D1: Define layout components (TopBar, SideNav, ContentShell, HelpDrawer) — skeleton only.
- D2: Service-tree data model (the catalog from §3 as a config the sidebar reads).
- D3: SideNav rendering the tree: expand/collapse, active state, icons.
- D4: TopBar: workspace name, global search box (UI), notifications, account menu.
- D5: Breadcrumb + page header pattern (title + primary action slot).
- D6: HelpDrawer component (opens per page; static content for now).
- D7: Route the existing Dashboard into the new shell as "Overview".
- D8: Responsive + light/dark pass on the shell; keyboard navigation.
- D9: Verify shell end-to-end (headless render, no regressions) and ship.

### Phase 2 — Services catalog
- D10: Add `enabledServices` to the Organization model + safe defaults/migration.
- D11: API: get/update enabled services (Owner/Admin only).
- D12: Sidebar reads `enabledServices` — hide disabled services.
- D13: "Services" admin screen: catalog grid with enable/disable toggles.
- D14: Guard routes/pages for disabled services (graceful "enable this service").
- D15: Verify + ship.

### Phase 3 — Guided onboarding
- D16: Stepper component (sliding steps, progress, back/next, validation).
- D17: Step 1 account, Step 2 company (size, industry).
- D18: Step 3 pick modules (maps to `enabledServices`), with smart defaults per industry.
- D19: Step 4 role & invite team, Step 5 goals/use-case.
- D20: Wire finish → create org + enable services + seed nothing fake; land on Overview.
- D21: Verify full new-user flow + ship.

### Phase 4 — Service workspaces  *(detailed when Phase 3 ships)*
- Per service: table + filters, create/edit side panel, empty-state, help content,
  verification. One service per 1–2 days, in the order listed in §5.

### Phase 5 — Guide & docs  *(detailed when Phase 4 nears done)*

### Phase 6 — Hardening & launch  *(detailed when Phase 5 nears done)*

---

## 7. Working agreement

- One phase at a time; one day-task at a time; verify before moving on.
- Every change keeps the app runnable and free of placeholder/fake content.
- Secrets never leave `.env.local`; commits stay clean and human-readable.
- This file is updated at the end of each phase to reflect reality.

---

## 8. Open decisions (to confirm as we go)

- Industry → default-modules mapping (which services pre-selected per industry).
- Visual identity: exact palette/typography for the console (start neutral, refine).
- Docs site host (in-repo static site vs. separate) — decide before Phase 5.
