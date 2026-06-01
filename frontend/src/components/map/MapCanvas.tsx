import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { GameEntity, DroneLink, RailSpline, BaseZone } from '../../types/save.types';
import type { LayerState } from '../ui/LayerToggles';
import { useAnimation } from '../../hooks/useAnimation';
import { createTerrainCanvas, drawTerrain, drawTerrainImage, drawOverlay } from './TerrainLayer';
import { drawEntities, drawLabels, drawEntityHighlight, drawInfectionRings } from './EntityLayer';
import { drawDroneLinks, aggregateFlows } from './DroneLayer';
import { drawRails } from './RailLayer';
import {
  world2screen,
  screen2world,
  GRID_SPACING,
  GRID_ZOOM_THRESHOLD,
  WORLD_BOUNDS,
  MAP_IMAGE,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_FACTOR,
  HIT_RADIUS_WORLD,
} from '../../constants/mapConfig';
import styles from './MapCanvas.module.css';

// Spatial grid for hover hit-testing: cell size comfortably larger than the hit
// radius so a 3x3 neighbourhood always contains any entity within range.
const HIT_CELL = HIT_RADIUS_WORLD * 3;

function buildEntityGrid(entities: GameEntity[]): Map<string, GameEntity[]> {
  const grid = new Map<string, GameEntity[]>();
  for (const e of entities) {
    const key = `${Math.floor(e.x / HIT_CELL)},${Math.floor(e.y / HIT_CELL)}`;
    const cell = grid.get(key);
    if (cell) cell.push(e);
    else grid.set(key, [e]);
  }
  return grid;
}

interface Props {
  entities: GameEntity[];
  links: DroneLink[];
  splines: RailSpline[];
  zones: BaseZone[];
  zoom: number;
  panX: number;
  panY: number;
  hoveredEntity: GameEntity | null;
  selectedEntity: GameEntity | null;
  layers: LayerState;
  selectedFlowItem: string | null;
  setZoom: (fn: (prev: number) => number) => void;
  setPanX: (fn: (prev: number) => number) => void;
  setPanY: (fn: (prev: number) => number) => void;
  setHoveredEntity: (entity: GameEntity | null) => void;
  setSelectedEntity: (entity: GameEntity | null) => void;
  setMouseScreenX: (x: number) => void;
  setMouseScreenY: (y: number) => void;
  setIsDragging: (v: boolean) => void;
  onResetView: (width: number, height: number) => void;
}

export function MapCanvas({
  entities,
  links,
  splines,
  zones,
  zoom,
  panX,
  panY,
  hoveredEntity,
  selectedEntity,
  layers,
  selectedFlowItem,
  setZoom,
  setPanX,
  setPanY,
  setHoveredEntity,
  setSelectedEntity,
  setMouseScreenX,
  setMouseScreenY,
  setIsDragging,
  onResetView,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainRef = useRef<HTMLCanvasElement | null>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Keep refs up to date
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const entitiesRef = useRef(entities);
  zoomRef.current = zoom;
  panXRef.current = panX;
  panYRef.current = panY;
  entitiesRef.current = entities;

  // Aggregate flows once per data change, not every animation frame.
  const flowEdges = useMemo(() => {
    const map = new Map<string, GameEntity>();
    for (const e of entities) map.set(e.id, e);
    return aggregateFlows(links, map);
  }, [entities, links]);

  // Infected entities get a pulsing ring on the animated layer (cheap: few of them).
  const infectedEntities = useMemo(() => entities.filter(e => e.infection > 0), [entities]);

  // Spatial index for hover hit-testing (rebuilt only when entities change).
  const entityGrid = useMemo(() => buildEntityGrid(entities), [entities]);
  const entityGridRef = useRef(entityGrid);
  entityGridRef.current = entityGrid;

  // Offscreen cache for static layers (terrain/rails/entities/labels). Redrawn
  // only when the view or data changes — not every animation frame.
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticDirtyRef = useRef(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { staticDirtyRef.current = true; },
    [zoom, panX, panY, entities, splines, zones, layers, selectedEntity]);

  useEffect(() => {
    terrainRef.current = createTerrainCanvas();
  }, []);

  useEffect(() => {
    if (!MAP_IMAGE) return;
    const img = new Image();
    img.src = MAP_IMAGE.path;
    img.onload = () => {
      mapImageRef.current = img;
      // The static cache may have been drawn before the image loaded.
      staticDirtyRef.current = true;
    };
  }, []);

  // Resize + initial resetView
  useEffect(() => {
    const handleResize = (): void => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const canvas = canvasRef.current;
    if (canvas) {
      onResetView(canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach wheel listener (must be non-passive for preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const prevZoom = zoomRef.current;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevZoom * factor));
      const ratio = newZoom / prevZoom;

      setPanX(() => mx - ratio * (mx - panXRef.current));
      setPanY(() => my - ratio * (my - panYRef.current));
      setZoom(() => newZoom);
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach mouse listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const findEntity = (sx: number, sy: number): GameEntity | null => {
      const world = screen2world(sx, sy, zoomRef.current, panXRef.current, panYRef.current);
      const cx = Math.floor(world.x / HIT_CELL);
      const cy = Math.floor(world.y / HIT_CELL);
      const grid = entityGridRef.current;
      let closest: GameEntity | null = null;
      let closestSq = HIT_RADIUS_WORLD * HIT_RADIUS_WORLD;
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const cell = grid.get(`${gx},${gy}`);
          if (!cell) continue;
          for (const entity of cell) {
            const dx = entity.x - world.x;
            const dy = entity.y - world.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < closestSq) {
              closestSq = distSq;
              closest = entity;
            }
          }
        }
      }
      return closest;
    };

    const onMouseDown = (e: MouseEvent): void => {
      if (e.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      dragStartRef.current = { x: mx, y: my, panX: panXRef.current, panY: panYRef.current };
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    const onMouseMove = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setMouseScreenX(mx);
      setMouseScreenY(my);

      const start = dragStartRef.current;
      if (start) {
        const dx = mx - start.x;
        const dy = my - start.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          isDraggingRef.current = true;
          setIsDragging(true);
        }
        canvas.style.cursor = 'grabbing';
        setPanX(() => start.panX + dx);
        setPanY(() => start.panY + dy);
      } else {
        const hit = findEntity(mx, my);
        setHoveredEntity(hit);
        canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
    };

    const onMouseUp = (e: MouseEvent): void => {
      const wasDragging = isDraggingRef.current;
      dragStartRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = findEntity(mx, my);
      canvas.style.cursor = hit ? 'pointer' : 'grab';

      if (!wasDragging && e.button === 0) {
        setSelectedEntity(hit);
      }
    };

    const onMouseLeave = (): void => {
      dragStartRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);
      setHoveredEntity(null);
      canvas.style.cursor = '';
    };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, z: number, px: number, py: number, w: number, h: number) => {
      if (z < GRID_ZOOM_THRESHOLD) return;
      ctx.strokeStyle = 'rgba(200, 208, 220, 0.08)';
      ctx.lineWidth = 1;

      const startX = Math.floor(WORLD_BOUNDS.minX / GRID_SPACING) * GRID_SPACING;
      const startY = Math.floor(WORLD_BOUNDS.minY / GRID_SPACING) * GRID_SPACING;

      for (let wx = startX; wx <= WORLD_BOUNDS.maxX; wx += GRID_SPACING) {
        const screen = world2screen(wx, 0, z, px, py);
        if (screen.x >= 0 && screen.x <= w) {
          ctx.beginPath();
          ctx.moveTo(screen.x, 0);
          ctx.lineTo(screen.x, h);
          ctx.stroke();
        }
      }
      for (let wy = startY; wy <= WORLD_BOUNDS.maxY; wy += GRID_SPACING) {
        const screen = world2screen(0, wy, z, px, py);
        if (screen.y >= 0 && screen.y <= h) {
          ctx.beginPath();
          ctx.moveTo(0, screen.y);
          ctx.lineTo(w, screen.y);
          ctx.stroke();
        }
      }
    },
    []
  );

  const drawBaseZones = useCallback(
    (ctx: CanvasRenderingContext2D, currentZones: BaseZone[], z: number, px: number, py: number) => {
      for (const zone of currentZones) {
        const tl = world2screen(zone.minX, zone.minY, z, px, py);
        const br = world2screen(zone.maxX, zone.maxY, z, px, py);
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.setLineDash([]);
      }
    },
    []
  );

  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      const terrain = terrainRef.current;
      if (!canvas || !terrain) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      // (Re)build the static cache only when the view or data changed.
      let staticCanvas = staticCanvasRef.current;
      if (!staticCanvas || staticCanvas.width !== w || staticCanvas.height !== h) {
        staticCanvas = document.createElement('canvas');
        staticCanvas.width = w;
        staticCanvas.height = h;
        staticCanvasRef.current = staticCanvas;
        staticDirtyRef.current = true;
      }

      if (staticDirtyRef.current) {
        const sctx = staticCanvas.getContext('2d');
        if (sctx) {
          if (layers.terrain) {
            const mapImage = mapImageRef.current;
            if (mapImage && MAP_IMAGE) {
              drawTerrainImage(sctx, mapImage, zoom, panX, panY, MAP_IMAGE.bounds, w, h);
            } else {
              drawTerrain(sctx, terrain, zoom, panX, panY, w, h);
            }
          } else {
            sctx.fillStyle = '#06090e';
            sctx.fillRect(0, 0, w, h);
          }
          drawOverlay(sctx, w, h);
          drawGrid(sctx, zoom, panX, panY, w, h);
          if (layers.baseZone) drawBaseZones(sctx, zones, zoom, panX, panY);
          if (layers.rails) drawRails(sctx, splines, zoom, panX, panY, w, h);
          // Plain entities (no hover/selection glow — that goes on the live layer).
          drawEntities(sctx, entities, zoom, panX, panY, w, h, null, null);
          if (layers.labels) drawLabels(sctx, entities, zoom, panX, panY, w, h, selectedEntity);
          staticDirtyRef.current = false;
        }
      }

      // Composite the cached static layers, then the animated content on top.
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(staticCanvas, 0, 0);

      if (layers.drones) {
        drawDroneLinks(ctx, flowEdges, zoom, panX, panY, timestamp, selectedFlowItem, hoveredEntity, selectedEntity);
      }
      if (layers.infection) {
        drawInfectionRings(ctx, infectedEntities, zoom, panX, panY, w, h, timestamp);
      }
      if (selectedEntity) {
        drawEntityHighlight(ctx, selectedEntity, zoom, panX, panY, w, h, true);
      }
      if (hoveredEntity && hoveredEntity.id !== selectedEntity?.id) {
        drawEntityHighlight(ctx, hoveredEntity, zoom, panX, panY, w, h, false);
      }
    },
    [zoom, panX, panY, entities, splines, zones, hoveredEntity, selectedEntity, layers, selectedFlowItem, flowEdges, infectedEntities, drawGrid, drawBaseZones]
  );

  useAnimation(render, true);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
