# StarRupture Base Scanner

Application web full-stack pour visualiser et analyser les sauvegardes du jeu **StarRupture** (Early Access, Creepy Jar).

Uploadez un fichier `.sav` et explorez votre base industrielle sur Arcadia-7 : carte interactive 2D, flux de drones animés, tableau de production, alertes d'infection.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| API Backend | Spring Boot 3.4 / Java 21 |
| Frontend | React 18 / TypeScript 5 / Vite 5 |
| Carte | Canvas 2D natif (terrain procédural fbm) |
| Base de données | PostgreSQL 16 |
| Cache | Redis 7 |
| Reverse proxy | Nginx |
| Conteneurisation | Docker Compose |
| CI/CD | GitLab CE auto-hébergé |

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
│   │   ├── controller/     # Points d'entrée REST (saves, entities, links, summary)
│   │   ├── service/        # Parseur .sav (zlib + JSON + regex), EntityService
│   │   ├── entity/         # Entités JPA (clé primaire UUID)
│   │   ├── dto/            # Objets de transfert de données
│   │   ├── repository/     # Spring Data JPA
│   │   ├── config/         # CORS, cache Redis
│   │   └── exception/      # Gestion globale des erreurs
│   └── src/main/resources/
│       └── db/migration/   # Flyway V1 (schéma) + V2 (index)
├── frontend/               # Application React + TypeScript
│   └── src/
│       ├── components/
│       │   ├── map/        # MapCanvas, TerrainLayer, EntityLayer, DroneLayer, RailLayer
│       │   ├── table/      # ProductionTable, MiniMap, EntityDetail
│       │   └── ui/         # TabBar, Legend, Tooltip, Badge, UploadButton
│       ├── hooks/          # useSaveData, useMapInteraction, useAnimation
│       ├── pages/          # MapPage, ProductionPage
│       ├── services/       # API Axios typé
│       ├── constants/      # Couleurs, configuration carte
│       └── types/          # Types DTO TypeScript
├── infra/
│   ├── docker-compose.yml  # Services : nginx, backend, postgres, redis
│   ├── docker-compose.staging.yml
│   └── nginx/nginx.conf
└── docs/
    ├── stories/            # User Stories (SR-001 à SR-012)
    └── PROGRESS.md         # Suivi d'avancement
```

## Fonctionnalités

### Carte interactive (MapPage)
- Terrain procédural 2D (fbm, biomes alien)
- Entités positionnées avec couleurs par catégorie (machine, énergie, infra, antenne, danger, loot)
- Zoom molette centré sur le curseur, déplacement par clic-glisser
- Survol avec surbrillance + infobulle, sélection avec panneau détail
- Flux de drones animés (flèches vertes avec direction)
- Rails DroneRail (orange) et Walkway (cyan pointillé)
- Alertes visuelles : anneau rouge pulsant pour l'infection, badge OFF

### Tableau de production (ProductionPage)
- Liste triable et filtrable de toutes les machines
- Recherche textuelle, filtre par statut (on/off) et catégorie
- Badges colorés pour catégorie et infection
- Minimap contextuelle centrée sur l'entité sélectionnée (rayon 60 000 unités)
- Panneau détail avec informations complètes et liens drones

### API REST

| Méthode | Point d'entrée | Description |
|---------|----------------|-------------|
| POST | `/api/saves` | Upload et analyse d'un fichier `.sav` |
| GET | `/api/saves` | Liste des sessions |
| DELETE | `/api/saves/{id}` | Suppression d'une session |
| GET | `/api/saves/{id}/entities` | Entités (filtrable par `?cat=`) |
| GET | `/api/saves/{id}/links` | Flux de drones |
| GET | `/api/saves/{id}/splines` | Rails et splines |
| GET | `/api/saves/{id}/zones` | Zones de base (bounding boxes) |
| GET | `/api/saves/{id}/summary` | Statistiques agrégées |

## Démarrage rapide

### Prérequis
- Docker et Docker Compose
- Java 21 + Maven 3.9 (développement backend)
- Node.js 20 (développement frontend)

### Développement local

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (nécessite PostgreSQL + Redis)
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Production (Docker Compose)

```bash
cd infra
DB_PASSWORD=motdepasse \
DOCKER_IMAGE_BACKEND=registry.exemple.com/backend:latest \
DOCKER_IMAGE_FRONTEND=registry.exemple.com/frontend:latest \
docker compose up -d
```

L'application est accessible sur le port **8888**.

## Pipeline CI/CD

```
build (JAR backend + dist frontend)
  → package (images Docker → GitLab Container Registry)
    → deploy (git clone/pull + docker compose up sur le serveur)
```

- **main** → déploiement production automatique
- **develop** → déploiement staging automatique

## Avancement

| Sprint | Points | Statut |
|--------|--------|--------|
| S1 — Fondations (upload, parseur, carte, zoom) | 26 | Terminé |
| S2 — Visualisation avancée (drones, rails, tableau, minimap, alertes) | 24 | Terminé |
| S3 — Filtres et CI/CD | 11 | En cours |
| **Total** | **61** | |
