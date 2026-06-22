# StarRupture Base Scanner

🌍 **English** · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Polski](README.pl.md)

A full-stack web application to visualize and analyze save files from the game **StarRupture** (Early Access, Creepy Jar).

Upload a `.sav` file and explore your industrial base on Arcadia-7: interactive 2D map, animated drone flows, production table, infection alerts.

## Overview

### Interactive map

![Interactive map](docs/screenshots/carte-interactive.png)

2D visualization of the base: procedural terrain, machines, drone flows, rails, infection zones and markers. Filter by category and by resource flow.

### TODO board (kanban)

![TODO board](docs/screenshots/todo-kanban.png)

Collaborative task organization in columns (construction, progression) with priorities and assignees.

### Administration

![Administration](docs/screenshots/administration.png)

Automatic FTP import of save files (Web-FTP gateway or direct FTP) and user management.

## Quick start

> 🧑‍🏫 **New to this?** Follow the **[step-by-step installation guide](docs/INSTALLATION.md)** —
> designed for non-technical users, it only requires Docker (no technical knowledge needed).

### Simple install (from source, Docker only)

```bash
cd infra
# Create a .env file with DB_PASSWORD and APP_AUTH_SECRET (see the installation guide),
# then build and start:
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

The application is then available at **http://localhost:8888** (admin / admin on first launch).

### Prerequisites (development)
- Docker and Docker Compose
- Java 21 + Maven 3.9 (backend development)
- Node.js 20 (frontend development)

### Local development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (requires PostgreSQL + Redis)
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Production (Docker Compose)

```bash
cd infra
DB_PASSWORD=password \
APP_AUTH_SECRET="$(openssl rand -base64 48)" \
DOCKER_IMAGE_BACKEND=registry.example.com/backend:latest \
DOCKER_IMAGE_FRONTEND=registry.example.com/frontend:latest \
docker compose up -d
```

The application is available on port **8888**.

## Tech stack

| Layer | Technology |
|--------|-------------|
| Backend API | Spring Boot 3.4 / Java 21 |
| Frontend | React 18 / TypeScript 5 / Vite 5 |
| Map | Native 2D Canvas (procedural fbm terrain) |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Reverse proxy | Nginx |
| Containerization | Docker Compose |
| CI/CD | Self-hosted GitLab CE |

## Architecture

```
                    ┌─────────────┐
                    │   Nginx     │ :8888
                    │  (frontend) │
                    └──────┬──────┘
                           │ /api/*
                    ┌──────▼──────┐
                    │  Spring Boot│ :8080
                    │  (backend)  │
                    └──┬──────┬───┘
                       │      │
              ┌────────▼┐  ┌──▼─────┐
              │PostgreSQL│  │ Redis  │
              │  :5432   │  │ :6379  │
              └──────────┘  └────────┘
```

## Monorepo structure

```
starrupture-web/
├── .gitlab-ci.yml          # CI/CD pipeline (build → package → deploy)
├── backend/                # Spring Boot REST API
│   ├── src/main/java/com/starrupture/scanner/
│   │   ├── controller/     # REST endpoints (saves, entities, links, summary)
│   │   ├── service/        # .sav parser (zlib + JSON + regex), EntityService
│   │   ├── entity/         # JPA entities (UUID primary key)
│   │   ├── dto/            # Data transfer objects
│   │   ├── repository/     # Spring Data JPA
│   │   ├── config/         # CORS, Redis cache
│   │   └── exception/      # Global error handling
│   └── src/main/resources/
│       └── db/migration/   # Flyway V1 (schema) → V11 (kanban TODO)
├── frontend/               # React + TypeScript application
│   └── src/
│       ├── components/
│       │   ├── map/        # MapCanvas, TerrainLayer, EntityLayer, DroneLayer, RailLayer
│       │   ├── table/      # ProductionTable, MiniMap, EntityDetail
│       │   └── ui/         # TabBar, Legend, Tooltip, Badge, UploadButton
│       ├── hooks/          # useSaveData, useMapInteraction, useAnimation
│       ├── pages/          # MapPage, ProgressionPage, AdminPage
│       ├── services/       # Typed Axios API
│       ├── constants/      # Colors, map configuration
│       └── types/          # TypeScript DTO types
├── infra/
│   ├── docker-compose.yml  # Services: nginx, backend, postgres, redis
│   └── nginx/nginx.conf
└── docs/
    ├── stories/            # User Stories (SR-001 to SR-012)
    └── PROGRESS.md         # Progress tracking
```

## Features

### Interactive map (MapPage)
- Procedural 2D terrain (fbm, alien biomes)
- Entities positioned with per-category colors (machine, energy, infra, antenna, danger, loot)
- Mouse-wheel zoom centered on the cursor, click-and-drag panning
- Visual cursor feedback (open hand when hovering the map, closed while panning, pointer over an entity)
- Hover highlight + tooltip, selection with a detail panel
- **Logistics flows** as curved arcs colored by resource, with **animated directional arrows** (producer → consumer direction)
- DroneRail rails (orange) and Walkway (dashed cyan)
- Visual alerts: pulsing red ring for infection, OFF badge
- **Filter by name**: shows only entities whose name matches (e.g. `sulfur-`), across all categories
- **Infection layer**: pulsing red ring on every infected building, always visible (even if its category is hidden), toggleable like the other layers
- **Orphans layer**: pulsing magenta ring on PackageSender/Receiver with no link at all (neither source nor destination), to spot unconfigured transmitters
- Toggleable layers: terrain, drone flows, rails, base zones, labels, infection, orphans
- Category filters + grouped side list (category → type), restricted to the viewport
- The most recent save is loaded automatically on startup

### Automatic import (Administration)

**Administration** tab to import the `.sav` directly from the game server host's FTP, without manual upload.

- FTP configuration stored server-side (host, port, user, password, path); the password is never sent back to the interface
- **Web-FTP HTTP gateway** (recommended): the `.sav` is downloaded via the host's HTTP bridge (e.g. 4Netplayers `handler.php`), which performs the FTP on the LAN side and returns the file over HTTPS. This bypasses the **passive FTP data channel** that is often blocked client-side, and works **with the game server running**
- Automatic fallback to direct FTP (FTP then FTPS) if the gateway URL is left empty
- Manual import ("Import now") or **automatic** at a configurable interval (`@Scheduled`)
- **Import the most recent slot**: if the FTP path points to a **folder** (ends with `/` or doesn't end with `.sav`), the import lists the `.sav` files in the folder and downloads the most recent one by modification date. This solves the `AutoSave0`/`1`/`2` slot rotation issue on the game server (a path pointing to a fixed file remains backward-compatible)
- **Wipe-and-replace**: any save load (manual upload **or** FTP import) first wipes existing sessions, then reloads the `.sav` fresh — so the application only ever keeps a single state (the last one loaded). Shared logic in `parseSavBytes`, atomic (`@Transactional`): if parsing fails, the wipe is rolled back
- **Batch inserts**: parsing accelerated via Hibernate JDBC batching (`batch_size`, `order_inserts`, `reWriteBatchedInserts`) — essential for saves with tens of thousands of entities
- **"Identical save" safeguard**: on import, the backend compares the **SHA-256 hash of the raw content** of the new `.sav` to the previous one. If unchanged, the file is identical down to the bit — the game wrote no new save (frozen file): a **warning banner** appears in the header. The content hash is reliable where the old `timestamp` + `playtime` comparison wrongly concluded "identical" whenever those two fields happened to match (falls back to that comparison for legacy sessions without a hash). The date shown in the header is the **save's internal date** (when the game wrote it), not the upload date — which reveals a stale file even if its download date looks recent

### Authentication

The application is protected by a **login screen**. Lightweight auth with no external dependency:

- Passwords hashed with **PBKDF2-HMAC-SHA256**, API tokens **HMAC-signed** (stateless, stored client-side in `localStorage`)
- A **default admin** (`admin` / `admin`) is created on first launch if no account exists — **change it immediately** via the interface (configurable via `APP_ADMIN_USER`/`APP_ADMIN_PASSWORD`)
- The **administrator** manages accounts (creation, password setting, deletion, ADMIN/USER role) from the Administration tab
- Every `/api/**` route requires a valid token; `/api/admin/**` requires the ADMIN role. The Administration tab is hidden for non-admin users
- Signing secret **required** via `APP_AUTH_SECRET`: the application **refuses to start** if it is not set (no default value, to avoid a shared secret that would allow forging tokens). Generate one with `openssl rand -base64 48`

### Collaborative markers

**Right-click** on the map to drop an **annotated marker** (pin with a label). Markers are visible to all players, stored in the database, and appear on a dedicated layer (toggleable). List with deletion in the sidebar.

### Logbook (import diff)

**LOGBOOK** tab: on each import, the backend automatically compares the new state to the previous snapshot and produces a **summary of changes**:
- **Playtime** delta, metrics (entities, powered-off machines, full outputs, infections…)
- Variations **by entity category**
- **Newly unlocked recipes**
- **Entity types** that appeared or disappeared

The diff is persisted on the session (`import_diff`), viewable at any time.

### TODO board (kanban)

**TODO** tab: a kanban board **shared** across all players to organize base projects.

- **Customizable columns**: create, rename, delete, **reorder by drag-and-drop** (⠿ handle on the column header) — To do / In progress / Done by default
- **Tasks** with title, description, **priority** (low/normal/high, colored dot), **assignee** (among existing accounts) and **due date** (highlighted if overdue)
- **Drag-and-drop** of cards between columns and reordering (native HTML5 drag & drop, no dependency)
- Each task remembers its **author** (current user)
- Data **independent from saves**: the kanban is never wiped by the import's wipe-and-replace

### Graphic themes

Theme selector in the header: the accent of the whole UI adapts to the **identity of a StarRupture corporation**.

- 6 dark themes: **Terminal** (cyan/green, default), **Selenian** (orange), **Moon Energy** (silver/cyan), **Clever Robotics** (red), **Future Health** (turquoise), **Griffith Blue** (blue) — they only change the **accent**
- 1 **Light** theme: light backgrounds + darkened accent for contrast — it additionally redefines the neutrals (backgrounds, borders, text)
- Implemented as **CSS variables**: accent (`--accent`, `--accent-2` + `-rgb` triplets) and neutrals (`--bg*`, `--border*`, `--text*`), applied via `[data-theme]` on `<html>`; choice **persisted** in `localStorage`
- The accent extends to the **map**: base zone outline, walkways and grid follow the theme (the canvas rendering reads `THEME_ACCENTS`, synced with the CSS variables)
- The **semantic colors of entity categories** (map) stay unchanged for readability

### Multilingual interface

The entire UI is translated into **5 languages**: **English** (default), **French**, **German**, **Spanish**, **Polish**.

- Language selector (🌐) in the header and on the login page
- Implemented with **react-i18next**; per-language translation files in `frontend/src/i18n/locales/`
- The chosen language is **saved in the user's profile** (server-side) and reapplied on each login, in addition to being remembered in `localStorage`
- **Game data** (entity names, recipes) and **proper nouns** (corporations) are not translated

### REST API

> All `/api/**` routes (except `/api/auth/login`) require the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---------|----------------|-------------|
| POST | `/api/auth/login` | Login → signed token (public) |
| GET | `/api/auth/me` | Current user (name, role, language) |
| PUT | `/api/auth/me/language` | Change the current user's language |
| GET / POST | `/api/admin/users` | List / create users (ADMIN) |
| PUT | `/api/admin/users/{id}/password` | Set the password (ADMIN) |
| DELETE | `/api/admin/users/{id}` | Delete a user (ADMIN) |

| Method | Endpoint | Description |
|---------|----------------|-------------|
| POST | `/api/saves` | Upload and parse a `.sav` file |
| GET | `/api/saves` | List sessions |
| DELETE | `/api/saves/{id}` | Delete a session |
| GET | `/api/saves/{id}/entities` | Entities (filterable by `?cat=`) |
| GET | `/api/saves/{id}/links` | Drone flows |
| GET | `/api/saves/{id}/splines` | Rails and splines |
| GET | `/api/saves/{id}/zones` | Base zones (bounding boxes) |
| GET | `/api/saves/{id}/summary` | Aggregated statistics |
| GET | `/api/saves/{id}/progression` | Corporations, unlocked/locked blueprints + collected items |
| GET / PUT | `/api/admin/config` | Read / write the FTP import configuration |
| POST | `/api/admin/test` | Connection test (HTTP gateway or FTP) |
| POST | `/api/admin/import` | Immediate import of the `.sav` from FTP/gateway |

| Method | Endpoint | Description |
|---------|----------------|-------------|
| GET | `/api/kanban/board` | Full kanban board (columns + tasks) |
| GET | `/api/kanban/users` | User list (for assignment) |
| POST / PUT / DELETE | `/api/kanban/columns[/{id}]` | Create / rename / delete a column |
| POST / PUT / DELETE | `/api/kanban/tasks[/{id}]` | Create / edit / delete a task |
| PUT | `/api/kanban/tasks/{id}/move` | Move a task (column + position) |

## CI/CD pipeline

```
build (backend JAR + frontend dist)
  → package (Docker images → GitLab Container Registry)
    → deploy (scp compose/nginx + docker compose pull/up on the server)
```

- **main** → **automatic production** deployment (direct delivery, no approval)
- Single `main → prod` flow: no `develop`/staging branch

## Progress

| Sprint | Points | Status |
|--------|--------|--------|
| S1 — Foundations (upload, parser, map, zoom) | 26 | Done |
| S2 — Advanced visualization (drones, rails, table, minimap, alerts) | 24 | Done |
| S3 — Filters and CI/CD | 11 | Done |
| **Total** | **61** | Done |

## License

Distributed under the **MIT** license — see the [LICENSE](LICENSE) file. You are free
to use, modify and redistribute this code, including for commercial purposes,
provided you keep the copyright notice.
