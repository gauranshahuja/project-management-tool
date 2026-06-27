<div align="center">

# 🏢 ProjectHub

### Multi-Tenant Project Management SaaS

A full-stack, multi-tenant platform where each company runs its projects, teams, and tasks in an **isolated workspace** — with four-tier role-based access control and invite-based onboarding. Built on the MERN stack.

![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white)

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-2ea44f?style=for-the-badge)](https://projecthub-client.web.app)

</div>

---

## Features

### Multi-tenant SaaS core
- **Organizations (workspaces):** signing up with a company name creates an isolated
  workspace; the first user becomes its Owner. All data is scoped per organization.
- **Invite-based onboarding:** Owners/Admins generate role-scoped invite links
  (7-day expiry). Invitees land on a join page, see who invited them, and register
  directly into the right company with the right role.
- **Role-based access control** with four fixed roles, enforced server-side on every
  route and mirrored in the UI:

  | Capability                          | Owner | Admin | Manager | Member |
  | ----------------------------------- | :---: | :---: | :-----: | :----: |
  | See all org projects                | ✓     | ✓     | own/member | own/member |
  | Create projects                     | ✓     | ✓     | ✓       | —      |
  | Invite teammates                    | ✓     | ✓     | —       | —      |
  | Invite/manage Admins                | ✓     | —     | —       | —      |
  | Change member roles / remove members| ✓     | ✓*    | —       | —      |
  | Update assigned tasks               | ✓     | ✓     | ✓       | ✓      |

  \* Admins cannot manage other Admins — only the Owner can.

### Project & task management
- Projects with status, due dates, descriptions, and member assignment.
- Task workspace per project: create, inline-edit, delete, assign to teammates,
  with search, status filters, pagination, and live status statistics.
- **My Tasks:** a cross-project view of everything assigned to you, with one-click
  status updates.

### Authentication
- Email/password auth with bcrypt hashing and JWT sessions.
- Social login (Google & GitHub) via Firebase, including cross-provider
  account linking.
- Legacy single-user accounts self-heal into personal workspaces on login.

### Engineering quality
- Centralized Express error handler with a consistent `{ error }` response shape.
- Security middleware: `helmet` headers and rate-limited auth endpoints.
- Role middleware (`requireRole`) and per-resource ownership checks.
- Zero-setup local development via an in-memory MongoDB (`npm run dev:memory`).
- Dark mode, responsive layout, accessible controls.

---

## Tech stack

| Layer      | Technology |
| ---------- | ---------- |
| Frontend   | React 19, Vite 7, Tailwind CSS, React Router 7, Axios, Framer Motion |
| Backend    | Node.js, Express 5, Mongoose 8 |
| Database   | MongoDB (Atlas in production, in-memory server for local dev) |
| Auth       | JWT, bcrypt, Firebase Auth (social login) |
| Security   | helmet, express-rate-limit, role-based middleware |
| Realtime   | Socket.io (presence, notifications) · optional Redis adapter for scaling |
| Deployment | Firebase Hosting (frontend) · Docker / Node host (backend) |

---

## Architecture

```
frontend/                    backend/
├── pages/                   ├── models/        User, Organization, Invite,
│   ├── LandingPage          │                  Project, Task
│   ├── Dashboard            ├── controllers/   user, org, project, task
│   ├── ProjectDetail        ├── middleware/    auth (JWT), requireRole,
│   ├── Members              │                  errorHandler
│   ├── MyTasks              ├── routes/        /api/users, /api/org,
│   └── JoinPage             │                  /api/projects, /api/tasks
├── components/              └── utils/         asyncHandler, generateToken
└── services/axiosInstance   
```

- The client talks to the API through a single Axios instance with a request
  interceptor (attaches JWT) and a response interceptor (auto-logout on 401).
- Every authenticated request loads the user fresh from the database, so role
  changes take effect immediately without re-login.
- Multi-tenancy is enforced at the query level: every project/task read or write
  is scoped to the requester's organization and role.

---

## Getting started

### Prerequisites
- Node.js 18+
- npm

### 1. Clone and install

```bash
git clone <repo-url>
cd project-management-tool

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

Each side ships a placeholder `.env` with safe defaults. For real secrets,
create a `.env.local` next to it (gitignored) — it overrides `.env`.

`backend/.env.local`:

```env
MONGO_URI=<your MongoDB connection string>   # not needed for dev:memory
JWT_SECRET=<a long random string>
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
# REDIS_URL=redis://localhost:6379           # only for multi-instance scaling
```

`frontend/.env` already points at the Vite proxy (`VITE_API_BASE_URL=/api`)
and carries the public Firebase web config.

### 3. Run locally

**Zero-setup mode (no MongoDB required):**

```bash
# Terminal 1 — API with in-memory MongoDB
cd backend
npm run dev:memory

# Terminal 2 — React client
cd frontend
npm run dev
```

Open http://localhost:5173, register with a company name, and explore.
Note: in-memory data resets when the server restarts.

**With a real MongoDB:** set `MONGO_URI` in `backend/.env.local` and use `npm run dev`.

**With Docker (API + MongoDB + Redis in one command):**

```bash
docker compose up --build
```

This starts the API on http://localhost:5000 with a local MongoDB and Redis.
Run the frontend separately with `cd frontend && npm run dev`.

---

## API overview

All endpoints are prefixed with `/api`. Protected routes require
`Authorization: Bearer <jwt>`.

| Area | Endpoints |
| ---- | --------- |
| Auth | `POST /users/register` · `POST /users/login` · `POST /users/social-login` · `GET /users/profile` |
| Organization | `GET /org` · `GET /org/members` · `POST /org/invites` · `GET /org/invites` · `DELETE /org/invites/:id` · `GET /org/invites/info?token=` (public) · `PATCH /org/members/:id/role` · `DELETE /org/members/:id` |
| Projects | `GET /projects` · `POST /projects` · `PUT /projects/:id` · `DELETE /projects/:id` |
| Tasks | `GET /tasks/project/:projectId` (paginated, searchable) · `GET /tasks/project/:projectId/stats` · `POST /tasks/project/:projectId` · `PUT /tasks/:id` · `DELETE /tasks/:id` · `GET /tasks/me` |

Errors always return `{ "error": "<message>" }` with appropriate status codes
(400 validation, 401 unauthenticated, 403 forbidden, 404 not found).

---

## Deployment

The frontend and backend deploy independently.

**Frontend → Firebase Hosting**

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

**Backend → any Node host (Render, Railway, Fly.io, or your own server)**

The backend is containerized, so it runs anywhere Docker does. On a platform
like Render, point it at the `backend/` folder (it auto-detects the Dockerfile)
and set these environment variables:

| Variable | Notes |
| -------- | ----- |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | long random string |
| `ALLOWED_ORIGINS` | your deployed frontend URL(s), comma separated |
| `APP_URL` | frontend URL used in email links |
| `REDIS_URL` | only if running more than one instance |
| `PORT` | usually provided by the host |

After the API is live, set the frontend's `VITE_API_BASE_URL` to the API URL
and add that frontend URL to `ALLOWED_ORIGINS` on the backend.

---

## Roadmap

- [ ] Email delivery for invites (currently link-sharing)
- [ ] HR module: employee records, attendance, leave tracking
- [ ] Activity feed and notifications
- [ ] Custom roles and granular permissions
- [ ] Billing and subscription tiers

---

## License

MIT
