import type { GameEntity, DroneLink } from '../../types/save.types';
import { world2screen } from '../../constants/mapConfig';

/** Reduce an item path/name to a readable label (e.g. "SulphurOre"). */
export function cleanItemName(item: string): string {
  let s = item;
  const dot = s.indexOf('.');
  if (dot > 0) s = s.substring(0, dot);
  const slash = s.lastIndexOf('/');
  if (slash >= 0 && slash < s.length - 1) s = s.substring(slash + 1);
  if (s.startsWith('I_')) s = s.substring(2);
  return s || 'Unknown';
}

/** Stable hue (0-359) derived from an item name. */
export function itemHue(item: string): number {
  let h = 0;
  for (let i = 0; i < item.length; i++) h = (h * 31 + item.charCodeAt(i)) >>> 0;
  return h % 360;
}

/** CSS color for an item, with optional alpha. */
export function itemColor(item: string, alpha = 1): string {
  return `hsla(${itemHue(item)}, 80%, 60%, ${alpha})`;
}

export interface FlowEdge {
  from: GameEntity;
  to: GameEntity;
  item: string;
  vol: number;
  isPackage: boolean;
}

/** Aggregate raw drone links into weighted (from, to, item) edges. */
export function aggregateFlows(
  links: DroneLink[],
  entityMap: Map<string, GameEntity>
): FlowEdge[] {
  const acc = new Map<string, FlowEdge>();
  for (const link of links) {
    const from = entityMap.get(link.fromEntityId);
    const to = entityMap.get(link.toEntityId);
    if (!from || !to) continue;
    const item = cleanItemName(link.item ?? 'Unknown');
    const isPackage = link.state === 'package';
    const key = `${link.fromEntityId}>${link.toEntityId}>${item}>${isPackage}`;
    const existing = acc.get(key);
    const vol = link.droneCount ?? 1;
    if (existing) existing.vol += vol;
    else acc.set(key, { from, to, item, vol, isPackage });
  }
  return [...acc.values()];
}

/** Distinct items present in the links, with total volume, sorted by volume desc. */
export function flowItems(links: DroneLink[]): Array<{ item: string; vol: number }> {
  const acc = new Map<string, number>();
  for (const link of links) {
    const item = cleanItemName(link.item ?? 'Unknown');
    acc.set(item, (acc.get(item) ?? 0) + (link.droneCount ?? 1));
  }
  return [...acc.entries()]
    .map(([item, vol]) => ({ item, vol }))
    .sort((a, b) => b.vol - a.vol);
}

interface ScreenArc {
  px: number; py: number;
  qx: number; qy: number;
  cx: number; cy: number;
}

function arcGeometry(
  from: GameEntity, to: GameEntity,
  zoom: number, panX: number, panY: number
): ScreenArc {
  const p = world2screen(from.x, from.y, zoom, panX, panY);
  const q = world2screen(to.x, to.y, zoom, panX, panY);
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  // perpendicular lift for a curved arc (consistent side)
  const nx = -dy / len;
  const ny = dx / len;
  const lift = len * 0.22;
  return {
    px: p.x, py: p.y, qx: q.x, qy: q.y,
    cx: (p.x + q.x) / 2 + nx * lift,
    cy: (p.y + q.y) / 2 + ny * lift,
  };
}

function bezier(t: number, a: ScreenArc): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * a.px + 2 * u * t * a.cx + t * t * a.qx,
    y: u * u * a.py + 2 * u * t * a.cy + t * t * a.qy,
  };
}

/** Tangent (derivative) of the quadratic bezier at t — gives the flow direction. */
function bezierTangent(t: number, a: ScreenArc): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: 2 * u * (a.cx - a.px) + 2 * t * (a.qx - a.cx),
    y: 2 * u * (a.cy - a.py) + 2 * t * (a.qy - a.cy),
  };
}

/** Draw a chevron arrowhead at (x, y) pointing along `angle`. */
function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number, size: number, color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.8, size * 0.72);
  ctx.lineTo(-size * 0.35, 0);
  ctx.lineTo(-size * 0.8, -size * 0.72);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/**
 * Draw logistics flows as weighted curved arcs coloured by resource, with
 * directional particles. `selectedItem` filters to one resource (null = all);
 * `hoveredEntity` isolates the flows touching that entity.
 */
export function drawDroneLinks(
  ctx: CanvasRenderingContext2D,
  allEdges: FlowEdge[],
  zoom: number,
  panX: number,
  panY: number,
  timestamp: number,
  selectedItem: string | null = null,
  hoveredEntity: GameEntity | null = null,
  selectedEntity: GameEntity | null = null
): void {
  const edges = selectedItem ? allEdges.filter(e => e.item === selectedItem) : allEdges;
  if (edges.length === 0) return;

  // Hover wins, otherwise the selected entity isolates its own connections.
  const focus = hoveredEntity ?? selectedEntity;
  const maxVol = edges.reduce((m, e) => Math.max(m, e.vol), 1);
  const time = timestamp / 1000;

  for (const e of edges) {
    const involved = !focus || e.from.id === focus.id || e.to.id === focus.id;
    const tn = e.vol / maxVol;
    const arc = arcGeometry(e.from, e.to, zoom, panX, panY);
    // Package (sender -> receiver) links are drawn noticeably thicker; their
    // volume is always 1 so they would otherwise be the thinnest arcs.
    const width = e.isPackage ? 4 + tn * 3 : 1.2 + tn * 5.5;
    const alpha = involved ? 0.85 : 0.06;

    // arc
    ctx.beginPath();
    ctx.moveTo(arc.px, arc.py);
    ctx.quadraticCurveTo(arc.cx, arc.cy, arc.qx, arc.qy);
    ctx.strokeStyle = itemColor(e.item, alpha);
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();

    // directional arrowheads travelling origin -> destination
    if (involved) {
      const count = Math.max(2, Math.round(tn * 7));
      const speed = 0.12 + tn * 0.18;
      const size = Math.max(4, width * 1.5);
      for (let i = 0; i < count; i++) {
        const tt = ((time * speed) + i / count) % 1;
        const pt = bezier(tt, arc);
        const tan = bezierTangent(tt, arc);
        const angle = Math.atan2(tan.y, tan.x);
        const fade = Math.sin(tt * Math.PI);
        drawArrowHead(ctx, pt.x, pt.y, angle, size, itemColor(e.item, 0.95 * fade));
      }
    }
  }
}
