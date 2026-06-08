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
│       └── db/migration/   # Flyway V1 (schéma) → V11 (kanban TODO)
├── frontend/               # Application React + TypeScript
│   └── src/
│       ├── components/
│       │   ├── map/        # MapCanvas, TerrainLayer, EntityLayer, DroneLayer, RailLayer
│       │   ├── table/      # ProductionTable, MiniMap, EntityDetail
│       │   └── ui/         # TabBar, Legend, Tooltip, Badge, UploadButton
│       ├── hooks/          # useSaveData, useMapInteraction, useAnimation
│       ├── pages/          # MapPage, ProgressionPage, AdminPage
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
- Retour visuel du curseur (main ouverte au survol de la carte, fermée pendant le déplacement, pointeur sur une entité)
- Survol avec surbrillance + infobulle, sélection avec panneau détail
- **Flux logistiques** en arcs courbes colorés par ressource, avec **flèches directionnelles animées** (sens producteur → consommateur)
- Rails DroneRail (orange) et Walkway (cyan pointillé)
- Alertes visuelles : anneau rouge pulsant pour l'infection, badge OFF
- **Filtre par nom** : n'affiche que les entités dont le nom correspond (ex. `soufre-`), toutes catégories confondues
- **Calque infection** : anneau rouge pulsant sur chaque bâtiment infecté, toujours visible (même si sa catégorie est masquée), activable/désactivable comme les autres calques
- **Calque orphelins** : anneau magenta pulsant sur les PackageSender/Receiver sans aucune liaison (ni source ni destination), pour repérer les transmetteurs non configurés
- Calques activables : terrain, flux drones, rails, zones de base, labels, infection, orphelins
- Filtres par catégorie + liste latérale groupée (catégorie → type), restreinte au viewport
- La sauvegarde la plus récente est chargée automatiquement au démarrage

### Import automatique (Administration)

Onglet **Administration** pour importer le `.sav` directement depuis le FTP de l'hébergeur du serveur de jeu, sans upload manuel.

- Configuration FTP stockée côté serveur (hôte, port, utilisateur, mot de passe, chemin) ; le mot de passe n'est jamais renvoyé à l'interface
- **Passerelle HTTP Web-FTP** (recommandé) : le `.sav` est téléchargé via le bridge HTTP de l'hébergeur (ex. 4Netplayers `handler.php`), qui réalise le FTP côté LAN et renvoie le fichier en HTTPS. Cela contourne le **canal de données FTP passif** souvent bloqué côté client, et fonctionne **serveur de jeu allumé**
- Repli automatique sur FTP direct (FTP puis FTPS) si l'URL passerelle est laissée vide
- Import manuel (« Importer maintenant ») ou **automatique** à intervalle configurable (`@Scheduled`)
- **Wipe-and-replace** : tout chargement de sauvegarde (upload manuel **ou** import FTP) efface d'abord les sessions existantes puis recharge le `.sav` à neuf — l'application ne conserve donc qu'un seul état (le dernier chargé). Logique commune dans `parseSavBytes`, atomique (`@Transactional`) : en cas d'échec du parsing, le wipe est annulé
- **Insertions par lot** : parsing accéléré via le batch JDBC Hibernate (`batch_size`, `order_inserts`, `reWriteBatchedInserts`) — indispensable pour les sauvegardes à plusieurs dizaines de milliers d'entités
- **Garde-fou « sauvegarde identique »** : à l'import, le backend compare le `timestamp` interne et le `playtime` du nouveau `.sav` à ceux du précédent. S'ils sont inchangés, le jeu n'a écrit aucune nouvelle sauvegarde (fichier gelé) : un **bandeau d'alerte** s'affiche dans l'en-tête. La date affichée dans l'en-tête est désormais la **date interne du save** (moment où le jeu a écrit), et non la date d'upload — ce qui révèle un fichier périmé même si sa date de téléchargement paraît récente

### Authentification

L'application est protégée par une **mire de connexion**. Auth légère sans dépendance externe :

- Mots de passe hachés en **PBKDF2-HMAC-SHA256**, jetons d'API **signés HMAC** (sans état, stockés côté client dans `localStorage`)
- Un **admin par défaut** (`admin` / `admin`) est créé au premier démarrage si aucun compte n'existe — **à changer immédiatement** via l'interface (configurable via `APP_ADMIN_USER`/`APP_ADMIN_PASSWORD`)
- L'**administrateur** gère les comptes (création, définition de mot de passe, suppression, rôle ADMIN/USER) depuis l'onglet Administration
- Toute route `/api/**` exige un jeton valide ; `/api/admin/**` exige le rôle ADMIN. L'onglet Administration est masqué pour les utilisateurs non‑admin
- Secret de signature configurable via `APP_AUTH_SECRET` (à définir en prod)

### Tableau TODO (kanban)

Onglet **TODO** : un tableau kanban **partagé** entre tous les joueurs pour organiser les chantiers de la base.

- **Colonnes personnalisables** : créer, renommer, supprimer, **réordonner par glisser-déposer** (poignée ⠿ sur l'en-tête de colonne) — À faire / En cours / Terminé par défaut
- **Tâches** avec titre, description, **priorité** (basse/normale/haute, pastille colorée), **assigné à** (parmi les comptes existants) et **échéance** (mise en évidence si dépassée)
- **Glisser-déposer** des cartes entre colonnes et réordonnancement (drag & drop natif HTML5, sans dépendance)
- Chaque tâche mémorise son **auteur** (utilisateur courant)
- Données **indépendantes des sauvegardes** : le kanban n'est jamais effacé par le wipe-and-replace de l'import

### Thèmes graphiques

Sélecteur de thème dans l'en-tête : l'accent de toute l'UI s'adapte à l'**identité d'une corporation** StarRupture.

- 6 thèmes sombres : **Terminal** (cyan/vert par défaut), **Selenian** (orange), **Moon Energy** (argent/cyan), **Clever Robotics** (rouge), **Future Health** (turquoise), **Griffith Blue** (bleu) — ils ne changent que l'**accent**
- 1 thème **Clair** : fonds clairs + accent assombri pour le contraste — redéfinit en plus les neutres (fonds, bordures, textes)
- Implémenté en **variables CSS** : accent (`--accent`, `--accent-2` + triplets `-rgb`) et neutres (`--bg*`, `--border*`, `--text*`), appliquées via `[data-theme]` sur `<html>` ; choix **persisté** dans `localStorage`
- L'accent s'étend à la **carte** : contour de la zone de base, walkways et grille suivent le thème (le rendu canvas lit `THEME_ACCENTS`, synchronisé avec les variables CSS)
- Les **couleurs sémantiques des catégories d'entités** (carte) restent inchangées pour la lisibilité

### API REST

> Toutes les routes `/api/**` (sauf `/api/auth/login`) exigent l'en-tête `Authorization: Bearer <jeton>`.

| Méthode | Point d'entrée | Description |
|---------|----------------|-------------|
| POST | `/api/auth/login` | Connexion → jeton signé (public) |
| GET | `/api/auth/me` | Utilisateur courant (nom, rôle) |
| GET / POST | `/api/admin/users` | Liste / création d'utilisateurs (ADMIN) |
| PUT | `/api/admin/users/{id}/password` | Définir le mot de passe (ADMIN) |
| DELETE | `/api/admin/users/{id}` | Suppression d'un utilisateur (ADMIN) |

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
| GET | `/api/saves/{id}/progression` | Corporations, plans débloqués/verrouillés + items collectés |
| GET / PUT | `/api/admin/config` | Lecture / écriture de la configuration d'import FTP |
| POST | `/api/admin/test` | Test de connexion (passerelle HTTP ou FTP) |
| POST | `/api/admin/import` | Import immédiat du `.sav` depuis le FTP/passerelle |

| Méthode | Point d'entrée | Description |
|---------|----------------|-------------|
| GET | `/api/kanban/board` | Tableau kanban complet (colonnes + tâches) |
| GET | `/api/kanban/users` | Liste des utilisateurs (pour l'assignation) |
| POST / PUT / DELETE | `/api/kanban/columns[/{id}]` | Créer / renommer / supprimer une colonne |
| POST / PUT / DELETE | `/api/kanban/tasks[/{id}]` | Créer / modifier / supprimer une tâche |
| PUT | `/api/kanban/tasks/{id}/move` | Déplacer une tâche (colonne + position) |

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
