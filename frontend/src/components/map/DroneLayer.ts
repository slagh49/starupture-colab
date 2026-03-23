import type { GameEntity, DroneLink } from '../../types/save.types';
import { world2screen } from '../../constants/mapConfig';

export function drawDroneLinks(
  ctx: CanvasRenderingContext2D,
  links: DroneLink[],
  entities: GameEntity[],
  zoom: number,
  panX: number,
  panY: number,
  timestamp: number
): void {
  const entityMap = new Map<string, GameEntity>();
  for (const e of entities) {
    entityMap.set(e.id, e);
  }

  for (const link of links) {
    const from = entityMap.get(link.fromEntityId);
    const to = entityMap.get(link.toEntityId);
    if (!from || !to) continue;

    drawDroneLink(ctx, from, to, link, zoom, panX, panY, timestamp);
  }
}

function drawDroneLink(
  ctx: CanvasRenderingContext2D,
  from: GameEntity,
  to: GameEntity,
  link: DroneLink,
  zoom: number,
  panX: number,
  panY: number,
  timestamp: number
): void {
  const sf = world2screen(from.x, from.y, zoom, panX, panY);
  const st = world2screen(to.x, to.y, zoom, panX, panY);
  const dashLen = Math.max(8, 18 * zoom);
  const offset = ((timestamp / 350) * dashLen) % (dashLen * 1.6);

  // Animated dashed line
  ctx.strokeStyle = 'rgba(57, 255, 20, 0.8)';
  ctx.lineWidth = Math.max(1.5, 2.5 * zoom);
  ctx.setLineDash([dashLen, dashLen * 0.6]);
  ctx.lineDashOffset = -offset;
  ctx.beginPath();
  ctx.moveTo(sf.x, sf.y);
  ctx.lineTo(st.x, st.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  // Directional arrow at midpoint
  const mx = (sf.x + st.x) / 2;
  const my = (sf.y + st.y) / 2;
  const angle = Math.atan2(st.y - sf.y, st.x - sf.x);
  const al = Math.max(5, 9 * zoom);

  ctx.fillStyle = '#39ff14';
  ctx.beginPath();
  ctx.moveTo(mx + Math.cos(angle) * al, my + Math.sin(angle) * al);
  ctx.lineTo(
    mx + Math.cos(angle + 2.5) * al * 0.5,
    my + Math.sin(angle + 2.5) * al * 0.5
  );
  ctx.lineTo(
    mx + Math.cos(angle - 2.5) * al * 0.5,
    my + Math.sin(angle - 2.5) * al * 0.5
  );
  ctx.closePath();
  ctx.fill();

  // Item label and drone count at midpoint
  const fontSize = Math.max(8, Math.min(11, 11 * zoom * 1500));
  ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';

  const labelText = link.item;
  const countText = `x${link.droneCount}`;
  const labelY = my - al - 4;

  // Background for label
  const labelWidth = ctx.measureText(labelText).width;
  const countWidth = ctx.measureText(countText).width;
  const totalWidth = Math.max(labelWidth, countWidth) + 8;

  ctx.fillStyle = 'rgba(6, 9, 14, 0.75)';
  ctx.fillRect(
    mx - totalWidth / 2,
    labelY - fontSize - 2,
    totalWidth,
    fontSize * 2 + 6
  );

  // Item name
  ctx.fillStyle = '#39ff14';
  ctx.fillText(labelText, mx, labelY);

  // Drone count
  ctx.fillStyle = 'rgba(57, 255, 20, 0.6)';
  ctx.fillText(countText, mx, labelY + fontSize + 2);
}
