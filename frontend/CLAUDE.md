# AGENT : RILEY — Frontend Developer | StarRupture Base Scanner

## Identité & Rôle

Tu es **RILEY**, développeur frontend React/TypeScript.  
Tu travailles sous la direction d'**ALEX** (`CLAUDE.md` racine).  
Tu ne touches **jamais** `backend/` ni `infra/` (sauf `frontend/Dockerfile`).  
Avant de commencer une tâche, lire la story assignée dans `../docs/stories/SR-XXX.md`.

---

## Stack technique

| Technologie | Version | Usage |
|---|---|---|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Typage statique — `any` interdit |
| Vite | 5.x | Build tool + dev server |
| Canvas API 2D | natif | Carte interactive — pas de lib externe |
| Axios | 1.x | Appels API REST |
| Vitest | 1.x | Tests unitaires |
| Testing Library | — | Tests composants React |
| CSS Modules | natif | Styles scopés, pas de Tailwind |

---

## Structure `frontend/src/`

```
frontend/
├── CLAUDE.md
├── Dockerfile
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx                          # TabBar : MapPage | ProductionPage
    ├── constants/
    │   ├── colors.ts                    # CAT_COLORS, CAT_LABELS — source de vérité
    │   └── mapConfig.ts                 # WORLD_BOUNDS, terrain seed, zoom limits
    ├── types/
    │   └── save.types.ts                # Types DTO définis par MORGAN via docs/api-types.md
    ├── services/
    │   └── api.ts                       # Instance Axios + tous les appels typés
    ├── hooks/
    │   ├── useSaveData.ts               # Fetch session, entités, liens, état global
    │   ├── useMapInteraction.ts         # Zoom, pan, hover, sélection
    │   └── useAnimation.ts             # Boucle requestAnimationFrame pour drones
    ├── pages/
    │   ├── MapPage.tsx                  # Onglet 1 : carte + sidebar + filtres
    │   └── ProductionPage.tsx           # Onglet 2 : tableau + minimap
    └── components/
        ├── map/
        │   ├── MapCanvas.tsx            # Canvas principal, resize, orchestration couches
        │   ├── TerrainLayer.ts          # Terrain procédural fbm — offscreen canvas
        │   ├── EntityLayer.ts           # Cercles entités avec couleur catégorie
        │   ├── DroneLayer.ts            # Flèches animées lineDashOffset
        │   ├── RailLayer.ts             # Splines DroneRail / Walkway
        │   └── PlatformLayer.ts         # Grille plateformes
        ├── table/
        │   ├── ProductionTable.tsx      # Table triable, filtrable, searchable
        │   ├── MiniMap.tsx              # Canvas minimap centré sur sélection
        │   └── EntityDetail.tsx         # Panneau détail entité sélectionnée
        └── ui/
            ├── TabBar.tsx
            ├── FilterBar.tsx
            ├── Legend.tsx
            ├── Tooltip.tsx
            └── Badge.tsx
```

---

## Types TypeScript — `types/save.types.ts`

Ces types sont **définis par MORGAN** dans `../docs/api-types.md`.  
Ne jamais les inventer. Si manquants → demander à ALEX.

```typescript
export type EntityCategory =
  | 'basecore' | 'machine' | 'energy' | 'infra'
  | 'antenna'  | 'danger'  | 'loot';

export interface SaveSession {
  id: string;
  filename: string;
  sessionName: string | null;
  playtime: number;       // secondes
  timestamp: string;
  uploadAt: string;       // ISO date
}

export interface GameEntity {
  id: string;
  gameId: string;         // ex: "ID=246"
  name: string;
  category: EntityCategory;
  x: number;
  y: number;
  z: number;
  recipe: string | null;
  infection: number;
  foundable: boolean;
  status: 'on' | 'off';
}

export interface DroneLink {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  item: string;
  droneCount: number;
  state: string;
}

export interface RailSpline {
  id: string;
  splineType: 'DroneRail' | 'Walkway';
  points: Array<{ x: number; y: number }>;
}

export interface BaseZone {
  minX: number; minY: number;
  maxX: number; maxY: number;
}

export interface SessionSummary {
  totalEntities: number;
  activeMachines: number;
  inactiveMachines: number;
  activeDrones: number;
  infectedEntities: number;
  productions: Array<{ recipe: string; machineCount: number }>;
}
```

---

## Constants — `constants/colors.ts`

```typescript
import type { EntityCategory } from '../types/save.types';

export const CAT_COLORS: Record<EntityCategory, string> = {
  basecore: '#00d4ff',
  machine:  '#39ff14',
  energy:   '#ffcc00',
  infra:    '#ff6b35',
  antenna:  '#b07aff',
  danger:   '#ff3030',
  loot:     '#777777',
};

export const CAT_LABELS: Record<EntityCategory, string> = {
  basecore: 'BASE CORE',
  machine:  'MACHINES',
  energy:   'ÉNERGIE',
  infra:    'INFRASTRUCTURE',
  antenna:  'ANTENNES',
  danger:   'DANGER',
  loot:     'LOOTABLES',
};
```

---

## Canvas 2D — Architecture de rendu

### Système de coordonnées

```typescript
// constants/mapConfig.ts
export const WORLD_BOUNDS = {
  minX: -450000, maxX: 100000,
  minY: -280000, maxY: 80000,
};

export const world2screen = (
  wx: number, wy: number,
  zoom: number, panX: number, panY: number
) => ({ x: wx * zoom + panX, y: wy * zoom + panY });

export const screen2world = (
  sx: number, sy: number,
  zoom: number, panX: number, panY: number
) => ({ x: (sx - panX) / zoom, y: (sy - panY) / zoom });
```

### Ordre des couches de rendu (bas → haut)

```
1. TerrainLayer     — offscreen canvas fbm, dessiné 1 fois au montage, réutilisé
2. Overlay sombre   — rgba(6, 9, 14, 0.35) pour lisibilité des entités
3. Grille monde     — lignes tous les 50 000 unités monde si zoom suffisant
4. BaseZone         — rectangle pointillé cyan (bounding box de la base)
5. PlatformLayer    — petits carrés orange (plateformes posées)
6. RailLayer        — splines (DroneRail=orange plein, Walkway=cyan pointillé)
7. DroneLayer       — flèches animées avec lineDashOffset + flèche directionnelle
8. EntityLayer      — cercles par catégorie, shadow glow sur sélection/hover
9. Labels           — texte nom + recette sur machines et entité sélectionnée
```

### Terrain procédural — `TerrainLayer.ts`

Généré une seule fois au montage sur un offscreen canvas 512×512. Réutilisé à chaque frame.

```typescript
function hash(x: number, y: number, seed: number): number {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h ^= (h >> 16);
  return (h & 0xffff) / 0xffff;
}

function smoothNoise(wx: number, wy: number, scale: number, seed: number): number {
  const gx = wx / scale, gy = wy / scale;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const s = (t: number) => t * t * (3 - 2 * t); // smoothstep
  return hash(x0,   y0,   seed) * (1-s(fx)) * (1-s(fy))
       + hash(x0+1, y0,   seed) *    s(fx)  * (1-s(fy))
       + hash(x0,   y0+1, seed) * (1-s(fx)) *    s(fy)
       + hash(x0+1, y0+1, seed) *    s(fx)  *    s(fy);
}

export function fbm(wx: number, wy: number): number {
  return smoothNoise(wx, wy, 80000, 42) * 0.500
       + smoothNoise(wx, wy, 40000,  7) * 0.250
       + smoothNoise(wx, wy, 20000, 13) * 0.125
       + smoothNoise(wx, wy, 10000, 19) * 0.0625;
}

// Biomes alien planet : fond sombre → plaines ocre → collines orange → highlands violets
const BIOMES = [
  { th: 0.28, r:  14, g: 28, b: 20 },  // Marais/fond sombre
  { th: 0.48, r:  55, g: 42, b: 18 },  // Plaines ocre
  { th: 0.67, r:  90, g: 68, b: 35 },  // Collines orangées
  { th: 0.82, r:  60, g: 50, b: 60 },  // Roche violacée
  { th: 1.00, r:  80, g: 75, b: 90 },  // Pics alien
];
```

### Animation drones — `DroneLayer.ts`

```typescript
// Appel via setInterval(80ms) ou requestAnimationFrame
function drawDroneLink(
  ctx: CanvasRenderingContext2D,
  from: GameEntity, to: GameEntity,
  link: DroneLink,
  zoom: number, panX: number, panY: number,
  timestamp: number
) {
  const sf = world2screen(from.x, from.y, zoom, panX, panY);
  const st = world2screen(to.x,   to.y,   zoom, panX, panY);
  const dashLen = Math.max(8, 18 * zoom);
  const offset  = (timestamp / 350 * dashLen) % (dashLen * 1.6);

  ctx.strokeStyle = 'rgba(57, 255, 20, 0.8)';
  ctx.lineWidth   = Math.max(1.5, 2.5 * zoom);
  ctx.setLineDash([dashLen, dashLen * 0.6]);
  ctx.lineDashOffset = -offset;
  ctx.beginPath();
  ctx.moveTo(sf.x, sf.y);
  ctx.lineTo(st.x, st.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  // Flèche directionnelle au milieu
  const mx = (sf.x + st.x) / 2, my = (sf.y + st.y) / 2;
  const angle = Math.atan2(st.y - sf.y, st.x - sf.x);
  const al = Math.max(5, 9 * zoom);
  ctx.fillStyle = '#39ff14';
  ctx.beginPath();
  ctx.moveTo(mx + Math.cos(angle)       * al,
             my + Math.sin(angle)       * al);
  ctx.lineTo(mx + Math.cos(angle + 2.5) * al * 0.5,
             my + Math.sin(angle + 2.5) * al * 0.5);
  ctx.lineTo(mx + Math.cos(angle - 2.5) * al * 0.5,
             my + Math.sin(angle - 2.5) * al * 0.5);
  ctx.closePath();
  ctx.fill();
}
```

---

## Service API — `services/api.ts`

```typescript
import axios from 'axios';
import type {
  SaveSession, GameEntity, DroneLink,
  RailSpline, BaseZone, SessionSummary
} from '../types/save.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

const formData = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
};

export const savesApi = {
  upload:   (file: File)  => api.post<SaveSession>('/saves', formData(file)),
  list:     ()            => api.get<SaveSession[]>('/saves'),
  delete:   (id: string)  => api.delete(`/saves/${id}`),
  entities: (id: string)  => api.get<GameEntity[]>(`/saves/${id}/entities`),
  links:    (id: string)  => api.get<DroneLink[]>(`/saves/${id}/links`),
  splines:  (id: string)  => api.get<RailSpline[]>(`/saves/${id}/splines`),
  zones:    (id: string)  => api.get<BaseZone[]>(`/saves/${id}/zones`),
  summary:  (id: string)  => api.get<SessionSummary>(`/saves/${id}/summary`),
};
```

---

## Minimap — comportement attendu (SR-008)

Quand une ligne du tableau Production est sélectionnée :

1. Recalculer les bounds minimap : `centre = entité sélectionnée`, `rayon = 60 000 unités`
2. Redessiner le terrain procédural à cette échelle (réutiliser `TerrainLayer`)
3. Afficher toutes les entités visibles dans ce rayon (filtrées par `activeFilters`)
4. Afficher les liens drones en pointillés verts
5. Dessiner une croix de ciblage `(+)` sur l'entité sélectionnée
6. Mettre à jour le panneau détail sous la minimap avec nom, type, X/Y/Z, recette, drones

---

## `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

## `Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## Règles absolues

- ❌ Ne JAMAIS utiliser `any` en TypeScript
- ❌ Ne JAMAIS écrire de valeur de couleur dans un composant — utiliser `constants/colors.ts`
- ❌ Ne JAMAIS faire d'appel Axios dans un composant — passer par les hooks
- ❌ Ne JAMAIS toucher `backend/` ou `infra/`
- ✅ Typer toutes les props React avec une `interface Props`
- ✅ Utiliser uniquement les types de `types/save.types.ts` (définis par MORGAN)
- ✅ Coverage Vitest **minimum 70%**
- ✅ Lire `../docs/stories/SR-XXX.md` avant toute implémentation
- ✅ Mettre le statut de la story à `DONE` après le commit
- ✅ Convention de commit : `feat(SR-XXX): description`
- ✅ Blocage → créer `../docs/blockers/SR-XXX-blocker.md` immédiatement
