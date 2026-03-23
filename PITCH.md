# StarRupture Base Scanner — Document de cadrage projet

> **Version** 1.0 · **Date** Mars 2026 · **Auteur** Samy  
> **Stack** Spring Boot 3 · React 18 · TypeScript · PostgreSQL · Docker · GitLab CI/CD

---

## Table des matières

1. [Contexte & Vision](#1-contexte--vision)
2. [Périmètre fonctionnel](#2-périmètre-fonctionnel)
3. [Architecture technique](#3-architecture-technique)
4. [Pipeline CI/CD](#4-pipeline-cicd)
5. [Équipe Multi-Agent Claude Code](#5-équipe-multi-agent-claude-code)
6. [Modèle de données](#6-modèle-de-données)
7. [Endpoints REST](#7-endpoints-rest)
8. [Roadmap — User Stories](#8-roadmap--user-stories)

---

## 1. Contexte & Vision

StarRupture est un jeu de survie/factory Early Access (Creepy Jar, janvier 2026) dans lequel les joueurs construisent des bases industrielles complexes sur la planète Arcadia-7. La progression est entièrement liée à l'optimisation des chaînes de production — extracteurs, fonderies, assembleurs connectés par des rails et des drones logistiques.

Le fichier de sauvegarde (`.sav`) est un JSON compressé zlib qui contient l'intégralité de l'état du monde : position de chaque bâtiment, recette active, inventaire, état des drones, niveau d'infection. Un premier prototype a démontré la faisabilité de l'extraction et de la visualisation de ces données.

### Objectif

Construire une application web full-stack de production, hébergée sur Docker, permettant à un joueur de :

- Charger un fichier `.sav` et visualiser sa base sur une carte interactive 2D
- Voir les liens de production entre machines et les flux de drones animés
- Consulter un tableau de production complet avec statuts, recettes, alertes
- Comparer plusieurs sauvegardes dans le temps (Lot 2)
- Être notifié des anomalies : machine inactive, infection, rail bloqué

---

## 2. Périmètre fonctionnel

### MVP — Lot 1

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| F-01 | Upload `.sav` | Décompression zlib côté serveur, parsing JSON, stockage PostgreSQL | P0 |
| F-02 | Carte interactive | Canvas 2D, terrain procédural, zoom/pan, entités positionnées | P0 |
| F-03 | Flux drones animés | Flèches animées source→destination avec item et compteur drones | P0 |
| F-04 | Tableau de production | Liste triable/filtrable, recettes, statuts, alertes infection | P0 |
| F-05 | Minimap contextuelle | Canvas minimap centré sur la sélection (onglet Tableau) | P1 |
| F-06 | Filtres par catégorie | BaseCore / Machines / Énergie / Infra / Antennes / Danger / Loot | P1 |
| F-07 | Alertes visuelles | Ring d'infection, badge statut OFF, tooltip détaillé | P1 |
| F-08 | Rails et splines | Tracé des rails DroneRail et Walkway sur la carte | P1 |

### Lot 2 — Post-MVP

- Authentification utilisateur (JWT / Keycloak — stack déjà maîtrisée)
- Comparaison de plusieurs sauvegardes côte à côte
- Graphe d'évolution temporelle (production sur la durée)
- Notification push WebSocket pour serveur dédié StarRupture
- Export PDF du rapport de base
- API publique pour intégration outils tiers

---

## 3. Architecture technique

### Stack retenu

| Couche | Technologie | Justification |
|---|---|---|
| Backend API | Spring Boot 3.x / Java 21 | Stack maîtrisé, robuste, excellent écosystème JSON |
| Frontend | React 18 + TypeScript 5 | Composants réutilisables, Canvas API natif |
| Base de données | PostgreSQL 16 | JSONB pour entités, extensible PostGIS futur |
| Conteneurisation | Docker + Docker Compose | Environnement reproductible, adapté homelab sans K8s |
| CI/CD | GitLab CE self-hosted | Déjà en place sur le homelab Debian de Samy |
| Reverse proxy | Nginx | TLS termination, routing `/api` et `/app` |
| Cache | Redis 7 | Cache des sessions parsées, sessions futures |

### Services Docker Compose

```
nginx        → port 80/443  — reverse proxy, sert le frontend buildé, TLS self-signed
backend      → port 8080    — Spring Boot API REST (interne uniquement)
postgres     → port 5432    — données persistantes, volume nommé
redis        → port 6379    — cache (interne uniquement)
```

### Structure du dépôt (monorepo)

```
starrupture-scanner/
├── CLAUDE.md                    ← Agent ALEX (Chef de Projet)
├── PITCH.md                     ← Ce fichier
├── docs/
│   ├── stories/                 ← SR-001.md, SR-002.md...
│   ├── blockers/                ← SR-XXX-blocker.md
│   ├── PROGRESS.md              ← Tableau d'avancement
│   ├── CHANGELOG.md             ← Historique des versions
│   └── api-types.md             ← Contrat types DTO (MORGAN → RILEY)
├── backend/
│   ├── CLAUDE.md                ← Agent MORGAN (Backend)
│   ├── Dockerfile
│   └── src/...
├── frontend/
│   ├── CLAUDE.md                ← Agent RILEY (Frontend)
│   ├── Dockerfile
│   └── src/...
└── infra/
    ├── docker-compose.yml
    ├── docker-compose.staging.yml
    ├── nginx/nginx.conf
    └── .gitlab-ci.yml
```

---

## 4. Pipeline CI/CD

### Stratégie de branches

| Branche | Rôle | Déclencheur CI |
|---|---|---|
| `main` | Production stable | Build + test + push image + deploy prod (manuel + approval) |
| `develop` | Intégration continue | Build + test + push image + deploy staging (automatique) |
| `feature/*` | Développement | Build + tests unitaires uniquement |
| `hotfix/*` | Correctifs urgents | Build + test + merge fast-track vers main |

### Stages `.gitlab-ci.yml`

```
validate    → Checkstyle (backend) + ESLint + TypeScript check (frontend)
test        → JUnit 5 + Mockito (backend) · Vitest (frontend)
build       → Maven package + Vite build production
package     → docker build backend & frontend, push GitLab Container Registry
scan        → Trivy vulnerability scan sur les images Docker
deploy:staging  → docker-compose up VM staging homelab (auto sur develop)
deploy:prod     → docker-compose up VM prod homelab (manuel, approval requis sur main)
```

### Environnements

| Env | Hôte | Port | Données | Reset |
|---|---|---|---|---|
| Staging | VM Debian homelab | 8081 | Données de test | Quotidien |
| Production | VM Debian homelab | 443 | Données réelles | Jamais (backup daily) |

---

## 5. Équipe Multi-Agent Claude Code

Le projet utilise **3 agents Claude Code** avec des fichiers `CLAUDE.md` distincts. Chaque agent opère dans son périmètre et communique via le dépôt Git partagé. **Tu interagis uniquement avec ALEX.**

### Agents

| Agent | Fichier | Périmètre | Responsabilités |
|---|---|---|---|
| **ALEX** | `CLAUDE.md` (racine) | Coordination globale | Cadrage, User Stories, coordination MORGAN/RILEY, suivi, validation, CI/CD |
| **MORGAN** | `backend/CLAUDE.md` | `backend/` uniquement | API Spring Boot, parser `.sav`, JPA, tests JUnit, Dockerfile backend |
| **RILEY** | `frontend/CLAUDE.md` | `frontend/` uniquement | SPA React+TypeScript, Canvas 2D, tableau, minimap, Dockerfile frontend |

### Protocole de communication inter-agents

```
1. ALEX crée docs/stories/SR-XXX.md (User Story complète)
2. MORGAN ou RILEY lit la story, implémente dans son périmètre
3. MORGAN ou RILEY commit : feat(SR-XXX): description courte
4. MORGAN ou RILEY met à jour statut story → DONE
5. ALEX valide les changements, met à jour docs/CHANGELOG.md
6. Blocage → créer docs/blockers/SR-XXX-blocker.md
```

### Règles de non-chevauchement

- MORGAN ne touche **jamais** `frontend/`
- RILEY ne touche **jamais** `backend/`
- `docker-compose.yml` et `.gitlab-ci.yml` sont sous responsabilité **ALEX**
- Le schéma SQL (`db/migration/`) est sous responsabilité **MORGAN**
- Les types TypeScript (`types/save.types.ts`) sont définis par **MORGAN** (`docs/api-types.md`) et consommés par **RILEY**

### Convention de commits

```
feat(SR-XXX): ajout fonctionnalité
fix(SR-XXX):  correction bug
chore:        tâche technique (config, deps, CI)
docs:         documentation uniquement
test:         ajout/modification tests
```

---

## 6. Modèle de données

### Tables PostgreSQL

#### `save_sessions`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
filename     VARCHAR(255) NOT NULL
session_name VARCHAR(100)
playtime     FLOAT              -- secondes de jeu
timestamp    VARCHAR(20)        -- ex: "20260323095530"
upload_at    TIMESTAMP DEFAULT NOW()
world_time   FLOAT
```

#### `game_entities`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id UUID NOT NULL REFERENCES save_sessions(id) ON DELETE CASCADE
game_id    VARCHAR(50)    -- ex: "ID=246"
name       VARCHAR(200)
category   VARCHAR(50)    -- basecore|machine|energy|infra|antenna|danger|loot
x          FLOAT NOT NULL
y          FLOAT NOT NULL
z          FLOAT NOT NULL
recipe     VARCHAR(200)   -- null si pas de recette active
infection  FLOAT DEFAULT 0
foundable  BOOLEAN DEFAULT FALSE
status     VARCHAR(20) DEFAULT 'on'
raw_path   TEXT           -- entityConfigDataPath original
```

#### `drone_links`
```sql
id             UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id     UUID NOT NULL REFERENCES save_sessions(id) ON DELETE CASCADE
from_entity_id UUID REFERENCES game_entities(id)
to_entity_id   UUID REFERENCES game_entities(id)
item           VARCHAR(200)
drone_count    INTEGER DEFAULT 1
state          VARCHAR(50)
```

#### `rail_splines`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id  UUID NOT NULL REFERENCES save_sessions(id) ON DELETE CASCADE
spline_type VARCHAR(50)   -- DroneRail | Walkway
points      JSONB NOT NULL -- [{"x": -322326.6, "y": -52996.2}, ...]
```

#### `base_zones`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id  UUID NOT NULL REFERENCES save_sessions(id) ON DELETE CASCADE
min_x       FLOAT
min_y       FLOAT
max_x       FLOAT
max_y       FLOAT
```

### Parsing `.sav` — Algorithme

Le fichier `.sav` est un JSON compressé **zlib** avec un header de **4 bytes** à ignorer.

```
1. Lire raw bytes du fichier
2. Ignorer bytes[0..3] (header Unreal Engine)
3. zlib.decompress(bytes[4:]) → JSON string
4. Parser itemData.Mass.entities → map d'entités
5. Pour chaque entité, parser fragmentValues[] par regex :
   - CrCraftingFragment     → SelectedRecipe → recette active
   - CrBuildingInfection... → CurrentInfectionLevel → niveau infection
   - CrLogisticsAgent...    → CurrentMovementStart/Target → DroneLink
   - AuSplineConnection...  → Position(X,Y,Z) → points RailSpline
   - CrMassBuildingBaseCore → CachedBoundingBox → BaseZone
6. Classifier chaque entité par catégorie selon entityConfigDataPath
7. Persister en base via repositories JPA
```

---

## 7. Endpoints REST

| Méthode | URL | Réponse | Description |
|---|---|---|---|
| POST | `/api/saves` | `SaveSessionDto` | Upload + parse d'un fichier `.sav` |
| GET | `/api/saves` | `List<SaveSessionDto>` | Liste des sessions uploadées |
| GET | `/api/saves/{id}/entities` | `List<GameEntityDto>` | Toutes les entités de la session |
| GET | `/api/saves/{id}/entities?cat=machine` | `List<GameEntityDto>` | Filtre par catégorie |
| GET | `/api/saves/{id}/links` | `List<DroneLinkDto>` | Flux drones |
| GET | `/api/saves/{id}/splines` | `List<RailSplineDto>` | Rails et splines |
| GET | `/api/saves/{id}/zones` | `List<BaseZoneDto>` | Bounding box de la base |
| GET | `/api/saves/{id}/summary` | `SummaryDto` | Statistiques agrégées |
| DELETE | `/api/saves/{id}` | `204 No Content` | Suppression d'une session |

---

## 8. Roadmap — User Stories

### Sprint 1 — Fondations (MORGAN + RILEY en parallèle)

| ID | Story | Agent | Points |
|---|---|---|---|
| SR-001 | En tant qu'utilisateur, je peux uploader un fichier `.sav` et voir la liste de mes sessions | MORGAN | 5 |
| SR-002 | En tant qu'utilisateur, le `.sav` est parsé et toutes les entités sont stockées en base | MORGAN | 8 |
| SR-003 | En tant qu'utilisateur, je vois la carte avec le terrain procédural et les entités positionnées | RILEY | 8 |
| SR-004 | En tant qu'utilisateur, je peux zoomer/panner la carte et cliquer une entité pour voir ses détails | RILEY | 5 |

### Sprint 2 — Visualisation avancée

| ID | Story | Agent | Points |
|---|---|---|---|
| SR-005 | En tant qu'utilisateur, je vois les flux de drones animés entre machines | RILEY | 5 |
| SR-006 | En tant qu'utilisateur, je vois les rails et splines tracés sur la carte | RILEY | 3 |
| SR-007 | En tant qu'utilisateur, j'ai un tableau de production triable et filtrable | RILEY | 8 |
| SR-008 | En tant qu'utilisateur, la minimap se centre sur l'entité sélectionnée dans le tableau | RILEY | 5 |
| SR-009 | En tant qu'utilisateur, je vois les alertes visuelles (infection, machine OFF) | RILEY | 3 |

### Sprint 3 — CI/CD et finalisation

| ID | Story | Agent | Points |
|---|---|---|---|
| SR-010 | En tant qu'utilisateur, je peux filtrer par catégorie d'entité sur la carte | RILEY | 3 |
| SR-011 | Le pipeline CI/CD construit et déploie l'app sur staging à chaque push `develop` | ALEX | 5 |
| SR-012 | Le déploiement prod est manuel avec approval sur GitLab | ALEX | 3 |

**Total MVP : 61 points — 3 sprints de 1-2 semaines**

---

## Pour démarrer

```bash
# 1. Créer le dépôt sur le GitLab homelab
git init starrupture-scanner && cd starrupture-scanner

# 2. Placer les fichiers CLAUDE.md aux bons endroits
#    CLAUDE.md          → racine         (ALEX)
#    backend/CLAUDE.md  → backend/       (MORGAN)
#    frontend/CLAUDE.md → frontend/      (RILEY)

# 3. Lancer Claude Code à la racine — tu parles à ALEX
claude

# 4. Premier message à ALEX :
# "ALEX, le pitch est dans PITCH.md. Lance le Sprint 1."
```
