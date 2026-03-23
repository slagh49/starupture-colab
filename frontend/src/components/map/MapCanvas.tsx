import { useRef, useEffect, useCallback } from 'react';
import type { GameEntity, DroneLink, BaseZone } from '../../types/save.types';
import { useAnimation } from '../../hooks/useAnimation';
import { createTerrainCanvas, drawTerrain, drawOverlay } from './TerrainLayer';
import { drawEntities, drawLabels } from './EntityLayer';
import { drawDroneLinks } from './DroneLayer';
import {
  world2screen,
  GRID_SPACING,
  GRID_ZOOM_THRESHOLD,
  WORLD_BOUNDS,
} from '../../constants/mapConfig';
import styles from './MapCanvas.module.css';

interface Props {
  entities: GameEntity[];
  links: DroneLink[];
  zones: BaseZone[];
  zoom: number;
  panX: number;
  panY: number;
  hoveredEntity: GameEntity | null;
  selectedEntity: GameEntity | null;
  onCanvasBind: (canvas: HTMLCanvasElement) => void;
  onCanvasUnbind: () => void;
  onResetView: (width: number, height: number) => void;
}

export function MapCanvas({
  entities,
  links,
  zones,
  zoom,
  panX,
  panY,
  hoveredEntity,
  selectedEntity,
  onCanvasBind,
  onCanvasUnbind,
  onResetView,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terrainRef.current = createTerrainCanvas();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCanvasBind(canvas);
    return () => {
      onCanvasUnbind();
    };
  }, [onCanvasBind, onCanvasUnbind]);

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
  }, [onResetView]);

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      currentZoom: number,
      currentPanX: number,
      currentPanY: number,
      w: number,
      h: number
    ) => {
      if (currentZoom < GRID_ZOOM_THRESHOLD) return;

      ctx.strokeStyle = 'rgba(200, 208, 220, 0.08)';
      ctx.lineWidth = 1;

      const startX =
        Math.floor(WORLD_BOUNDS.minX / GRID_SPACING) * GRID_SPACING;
      const endX = WORLD_BOUNDS.maxX;
      const startY =
        Math.floor(WORLD_BOUNDS.minY / GRID_SPACING) * GRID_SPACING;
      const endY = WORLD_BOUNDS.maxY;

      for (let wx = startX; wx <= endX; wx += GRID_SPACING) {
        const screen = world2screen(wx, 0, currentZoom, currentPanX, currentPanY);
        if (screen.x >= 0 && screen.x <= w) {
          ctx.beginPath();
          ctx.moveTo(screen.x, 0);
          ctx.lineTo(screen.x, h);
          ctx.stroke();
        }
      }

      for (let wy = startY; wy <= endY; wy += GRID_SPACING) {
        const screen = world2screen(0, wy, currentZoom, currentPanX, currentPanY);
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
    (
      ctx: CanvasRenderingContext2D,
      currentZones: BaseZone[],
      currentZoom: number,
      currentPanX: number,
      currentPanY: number
    ) => {
      for (const zone of currentZones) {
        const topLeft = world2screen(
          zone.minX,
          zone.minY,
          currentZoom,
          currentPanX,
          currentPanY
        );
        const bottomRight = world2screen(
          zone.maxX,
          zone.maxY,
          currentZoom,
          currentPanX,
          currentPanY
        );

        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(
          topLeft.x,
          topLeft.y,
          bottomRight.x - topLeft.x,
          bottomRight.y - topLeft.y
        );
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

      // 1. Terrain
      drawTerrain(ctx, terrain, zoom, panX, panY, w, h);

      // 2. Overlay
      drawOverlay(ctx, w, h);

      // 3. Grid
      drawGrid(ctx, zoom, panX, panY, w, h);

      // 4. Base zones
      drawBaseZones(ctx, zones, zoom, panX, panY);

      // 5. Platforms (Sprint 2)
      // drawPlatforms(ctx, zoom, panX, panY, w, h);

      // 6. Rails (Sprint 2)
      // drawRails(ctx, [], zoom, panX, panY, w, h);

      // 7. Drone links
      drawDroneLinks(ctx, links, entities, zoom, panX, panY, timestamp);

      // 8. Entities
      drawEntities(ctx, entities, zoom, panX, panY, w, h, hoveredEntity, selectedEntity);

      // 9. Labels
      drawLabels(ctx, entities, zoom, panX, panY, w, h, selectedEntity);
    },
    [
      zoom,
      panX,
      panY,
      entities,
      links,
      zones,
      hoveredEntity,
      selectedEntity,
      drawGrid,
      drawBaseZones,
    ]
  );

  useAnimation(render, true);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
