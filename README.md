# StarRupture Base Scanner

Application web full-stack pour visualiser et analyser les sauvegardes du jeu **StarRupture** (Early Access, Creepy Jar).

Uploadez un fichier `.sav` et explorez votre base industrielle sur Arcadia-7 : carte interactive 2D, flux de drones animés, tableau de production, alertes d'infection.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend API | Spring Boot 3.4 / Java 21 |
| Frontend | React 18 / TypeScript 5 / Vite 5 |
| Carte | Canvas 2D natif (terrain procédural fbm) |
| Base de données | PostgreSQL 16 |
| Cache | Redis 7 |
| Reverse proxy | Nginx |
| Conteneurisation | Docker Compose |
| CI/CD | GitLab CE self-hosted |

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

## Structure du monorepo

```
starrupture-web/
├── .gitlab-ci.yml          # Pipeline CI/CD (build → package → deploy)
├── backend/                # API REST Spring Boot
│   ├── src/main/java/com/starrupture/scanner/
│   │   ├── controller/     # Endpoints REST (saves, entities, links, summary)
│   │   ├── service/        # Parser .sav (zlib + JSON + regex), EntityService
│   │   ├── entity/         # Entités JPA (UUID PK)
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── repository/     # Spring Data JPA
│   │   ├── config/         # CORS, Redis cache
│   │   └── exception/      # Error handling global
│   └── src/main/resources/
│       └── db/migration/   # Flyway V1 (schema) + V2 (indexes)
├── frontend/               # SPA React + TypeScript
│   └── src/
│       ├── components/
│       │   ├── map/        # MapCanvas, TerrainLayer, EntityLayer, DroneLayer, RailLayer
│       │   ├── table/      # ProductionTable, MiniMap, EntityDetail
│       │   └── ui/         # TabBar, Legend, Tooltip, Badge, UploadButton
│       ├── hooks/          # useSaveData, useMapInteraction, useAnimation
│       ├── pages/          # MapPage, ProductionPage
│       ├── services/       # API Axios typé
│       ├── constants/      # Couleurs, config carte
│       └── types/          # Types DTO TypeScript
├── infra/
│   ├── docker-compose.yml  # Services: nginx, backend, postgres, redis
│   ├── docker-compose.staging.yml
│   └── nginx/nginx.conf
└── docs/
    ├── stories/            # User Stories (SR-001 à SR-012)
    └── PROGRESS.md         # Suivi d'avancement
```

## Fonctionnalites

### Carte interactive (MapPage)
- Terrain procédural 2D (fbm, biomes alien)
- Entites positionnees avec couleurs par categorie (machine, energie, infra, antenne, danger, loot)
- Zoom molette centre sur curseur, pan clic-drag
- Hover highlight + tooltip, selection avec panneau detail
- Flux de drones animes (fleches vertes avec direction)
- Rails DroneRail (orange) et Walkway (cyan pointille)
- Alertes visuelles : ring rouge pulsant infection, badge OFF

### Tableau de production (ProductionPage)
- Liste triable et filtrable de toutes les machines
- Recherche textuelle, filtre statut (on/off) et categorie
- Badges colores categorie et infection
- Minimap contextuelle centree sur l'entite selectionnee (rayon 60 000 unites)
- Panneau detail avec infos completes et liens drones

### API REST

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/saves` | Upload et parse un fichier `.sav` |
| GET | `/api/saves` | Liste des sessions |
| DELETE | `/api/saves/{id}` | Supprime une session |
| GET | `/api/saves/{id}/entities` | Entites (filtrable `?cat=`) |
| GET | `/api/saves/{id}/links` | Flux drones |
| GET | `/api/saves/{id}/splines` | Rails et splines |
| GET | `/api/saves/{id}/zones` | Bounding boxes |
| GET | `/api/saves/{id}/summary` | Statistiques agregees |

## Demarrage rapide

### Prerequis
- Docker et Docker Compose
- Java 21 + Maven 3.9 (dev backend)
- Node.js 20 (dev frontend)

### Dev local

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (necessite PostgreSQL + Redis)
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Production (Docker Compose)

```bash
cd infra
DB_PASSWORD=changeme \
DOCKER_IMAGE_BACKEND=registry.example.com/backend:latest \
DOCKER_IMAGE_FRONTEND=registry.example.com/frontend:latest \
docker compose up -d
```

L'application est accessible sur le port **8888**.

## Pipeline CI/CD

```
build (backend JAR + frontend dist)
  → package (Docker images → GitLab Container Registry)
    → deploy (git clone/pull + docker compose up sur le serveur)
```

- **main** → deploy prod automatique
- **develop** → deploy staging automatique

## Avancement

| Sprint | Points | Statut |
|--------|--------|--------|
| S1 — Fondations (upload, parser, carte, zoom) | 26 | Termine |
| S2 — Visualisation avancee (drones, rails, tableau, minimap, alertes) | 24 | Termine |
| S3 — Filtres et CI/CD | 11 | En cours |
| **Total** | **61** | |
