import { useRef, useEffect, useCallback } from 'react';
import type { GameEntity, DroneLink } from '../../types/save.types';
import { CAT_COLORS } from '../../constants/colors';
import { createTerrainCanvas, drawTerrain, drawOverlay } from '../map/TerrainLayer';
import styles from './MiniMap.module.css';

const MINIMAP_RADIUS = 60000;
const MINIMAP_SIZE = 280;

interface Props {
  entities: GameEntity[];
  links: DroneLink[];
  selectedEntity: GameEntity | null;
}

export function MiniMap({ entities, links, selectedEntity }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    terrainRef.current = createTerrainCanvas();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const terrain = terrainRef.current;
    if (!canvas || !terrain) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    if (!selectedEntity) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#06090e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#4a5568';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select an entity', w / 2, h / 2);
      return;
    }

    // Calculate zoom/pan to center on selected entity with MINIMAP_RADIUS
    const centerX = selectedEntity.x;
    const centerY = selectedEntity.y;
    const zoom = (w / 2) / MINIMAP_RADIUS;
    const panX = w / 2 - centerX * zoom;
    const panY = h / 2 - centerY * zoom;

    // 1. Terrain
    drawTerrain(ctx, terrain, zoom, panX, panY, w, h);

    // 2. Overlay
    drawOverlay(ctx, w, h);

    // 3. Drone links
    const entityMap = new Map<string, GameEntity>();
    for (const e of entities) {
      entityMap.set(e.id, e);
    }

    ctx.strokeStyle = 'rgba(57, 255, 20, 0.5)';
    ctx.lineWidth = 1;
    const dashLen = Math.max(3, 6 * zoom);
    ctx.setLineDash([dashLen, dashLen * 0.6]);

    for (const link of links) {
      const from = entityMap.get(link.fromEntityId);
      const to = entityMap.get(link.toEntityId);
      if (!from || !to) continue;

      const sfx = from.x * zoom + panX;
      const sfy = from.y * zoom + panY;
      const stx = to.x * zoom + panX;
      const sty = to.y * zoom + panY;

      // Skip if both endpoints are offscreen
      if (
        (sfx < -10 && stx < -10) ||
        (sfx > w + 10 && stx > w + 10) ||
        (sfy < -10 && sty < -10) ||
        (sfy > h + 10 && sty > h + 10)
      ) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(sfx, sfy);
      ctx.lineTo(stx, sty);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 4. Entities in radius
    const radius = Math.max(2, 4 * zoom * 1000);
    for (const entity of entities) {
      const dx = entity.x - centerX;
      const dy = entity.y - centerY;
      if (Math.sqrt(dx * dx + dy * dy) > MINIMAP_RADIUS) continue;

      const sx = entity.x * zoom + panX;
      const sy = entity.y * zoom + panY;
      const color = CAT_COLORS[entity.category];
      const isSelected = entity.id === selectedEntity.id;

      ctx.beginPath();
      ctx.arc(sx, sy, isSelected ? radius * 1.5 : radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = entity.status === 'off' ? 0.4 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 5. Crosshair on selected entity
    const cx = selectedEntity.x * zoom + panX;
    const cy = selectedEntity.y * zoom + panY;
    const crossSize = 12;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy);
    ctx.lineTo(cx - 4, cy);
    ctx.moveTo(cx + 4, cy);
    ctx.lineTo(cx + crossSize, cy);
    ctx.moveTo(cx, cy - crossSize);
    ctx.lineTo(cx, cy - 4);
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx, cy + crossSize);
    ctx.stroke();
  }, [entities, links, selectedEntity]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>MINIMAP</div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
      />
    </div>
  );
}
