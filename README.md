# Task Manager (React + Express + MongoDB)

Production-ready Task Manager with **JWT auth (access + refresh)**, **role-based permissions**, and a **dark-mode-first UI**.

## Prerequisites

- Node.js 18+ (or 20+)
- MongoDB running locally or via Atlas

## Setup

### 1) Server env

Create `server/.env` from `server/.env.example`:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `PORT`
- `CLIENT_URL` (e.g. `http://localhost:5173`)

### 2) Client env

Create `client/.env` from `client/.env.example`:

- `VITE_API_BASE_URL` (e.g. `http://localhost:9000`)

### 3) Install dependencies

From repo root:

```bash
npm install
```

## Run (dev)

Option A (recommended): run both server + client in one command:

```bash
npm run dev
```

Option B: run in two terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Server health check: `GET /api/health`

UI tip: open a project (`/projects/:id`) to use the Kanban board and create tasks via **New task**.

## Seed database

```bash
cd server
npm run seed
```

- By default, the seed script **generates random passwords** and prints them once to the console.
- Optional: set `SEED_ADMIN_PASSWORD`, `SEED_MANAGER_PASSWORD`, `SEED_EMPLOYEE_PASSWORD` in your shell before running seed.

## Roles & permissions (enforced backend + frontend)

- **admin**
  - Full CRUD across users/projects/tasks
  - Can update user roles
  - Access to `/admin`
- **manager**
  - Create/manage projects
  - Create tasks within projects they belong to
  - Assign tasks to members
- **employee**
  - Can only access tasks assigned to them
  - Can update task status + add comments
  - Cannot create projects or delete tasks

## Auth (JWT)

- **Access token**: 15 minutes (stored in `localStorage`)
- **Refresh token**: 7 days (stored in **httpOnly cookie**)
- **Refresh rotation**: refresh token is rotated on each `/refresh` and stored hashed in DB

## API routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Users (admin only)
- `GET /api/users`
- `PATCH /api/users/:id/role`
- `DELETE /api/users/:id`

### Projects
- `GET /api/projects` (role-filtered)
- `POST /api/projects` (admin/manager)
- `GET /api/projects/:id` (membership enforced)
- `PATCH /api/projects/:id` (admin/manager)
- `DELETE /api/projects/:id` (admin)

### Tasks
- `GET /api/tasks` (role-filtered)  
  Filters: `?status=&priority=&project=&assignee=&page=&limit=`
- `POST /api/tasks` (admin/manager)
- `GET /api/tasks/:id` (role/assignment enforced)
- `PATCH /api/tasks/:id`
  - employee: status-only
  - manager/admin: full update
- `DELETE /api/tasks/:id` (manager/admin)
- `POST /api/tasks/:id/comments` (add comment)

## Response format

All endpoints return:

```json
{ "success": true|false, "data": any|null, "message": "...", "errors": "optional" }
```
