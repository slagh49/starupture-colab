import type { GameEntity } from '../../types/save.types';
import { CAT_COLORS } from '../../constants/colors';
import { world2screen } from '../../constants/mapConfig';
import { displayName } from '../../utils/format';

const BASE_RADIUS = 5;
const LABEL_FONT_SIZE = 10;
/** Infection ring color from CAT_COLORS.danger */
const INFECTION_COLOR = '#ff3030';
/** Ring color for orphan package senders/receivers (magenta) */
const ORPHAN_COLOR = '#ff5fa2';

export function drawEntities(
  ctx: CanvasRenderingContext2D,
  entities: GameEntity[],
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
  hoveredEntity: GameEntity | null,
  selectedEntity: GameEntity | null
): void {
  const maxR = Math.max(2, Math.min(zoom * 3500, 7));

  for (const entity of entities) {
    const screen = world2screen(entity.x, entity.y, zoom, panX, panY);

    if (
      screen.x < -maxR * 2 ||
      screen.x > canvasWidth + maxR * 2 ||
      screen.y < -maxR * 2 ||
      screen.y > canvasHeight + maxR * 2
    ) {
      continue;
    }

    // Structural tiles (platforms/rails) are tiny and faint so they don't
    // bury the map, the machines and the flows under a grey blob.
    const isInfra = entity.category === 'infra';
    const radius = isInfra ? Math.max(1.5, Math.min(zoom * 1500, 3)) : maxR;
    const color = CAT_COLORS[entity.category];
    const isHovered = hoveredEntity?.id === entity.id;
    const isSelected = selectedEntity?.id === entity.id;
    const isOff = entity.status === 'off';

    // Infection markers are drawn on the animated layer (drawInfectionRings)
    // so they pulse and stay visible — the static ring here was nearly
    // invisible because its alpha was scaled by infection/100.

    // Glow on hover/select
    if (isHovered || isSelected) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = isSelected ? 20 : 12;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    // Entity circle - reduced opacity for OFF entities (SR-009)
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = isOff ? 0.4 : isInfra ? 0.5 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;

    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // OFF badge (SR-009)
    if (isOff) {
      const badgeFontSize = Math.max(6, Math.min(8, 8 * zoom * 1500));
      ctx.font = `bold ${badgeFontSize}px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(6, 9, 14, 0.7)';
      const offWidth = ctx.measureText('OFF').width;
      ctx.fillRect(
        screen.x - offWidth / 2 - 2,
        screen.y + radius + 2,
        offWidth + 4,
        badgeFontSize + 2
      );
      ctx.fillStyle = '#777777';
      ctx.fillText('OFF', screen.x, screen.y + radius + badgeFontSize + 1);
    }
  }
}

/**
 * Draw a bright pulsing red ring on every infected entity. Runs on the animated
 * layer each frame so the ring actually pulses, and any infection > 0 is clearly
 * visible regardless of its magnitude (values range from ~0.01 to 15+).
 */
export function drawInfectionRings(
  ctx: CanvasRenderingContext2D,
  entities: GameEntity[],
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
  timestamp: number
): void {
  const maxR = Math.max(2, Math.min(zoom * 3500, 7));
  const phase = Math.abs(Math.sin(timestamp / 650));
  const alpha = 0.55 + 0.45 * phase;

  for (const entity of entities) {
    if (!(entity.infection > 0)) continue;
    const screen = world2screen(entity.x, entity.y, zoom, panX, panY);
    if (
      screen.x < -20 || screen.x > canvasWidth + 20 ||
      screen.y < -20 || screen.y > canvasHeight + 20
    ) {
      continue;
    }

    const isInfra = entity.category === 'infra';
    const radius = isInfra ? Math.max(1.5, Math.min(zoom * 1500, 3)) : maxR;
    const ringRadius = Math.max(6, radius * 2.2 + 2 + radius * 0.5 * phase);

    ctx.save();
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = INFECTION_COLOR;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = INFECTION_COLOR;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Generic pulsing ring used by the diagnostic overlays (no-power, orphans).
 * Same look as the infection ring but in an arbitrary color.
 */
function drawPulsingRings(
  ctx: CanvasRenderingContext2D,
  entities: GameEntity[],
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
  timestamp: number,
  color: string
): void {
  const phase = Math.abs(Math.sin(timestamp / 650));
  const alpha = 0.55 + 0.45 * phase;
  const baseR = Math.max(2, Math.min(zoom * 3500, 7));
  const ringRadius = Math.max(6, baseR * 2.2 + 2 + baseR * 0.5 * phase);

  for (const entity of entities) {
    const screen = world2screen(entity.x, entity.y, zoom, panX, panY);
    if (
      screen.x < -20 || screen.x > canvasWidth + 20 ||
      screen.y < -20 || screen.y > canvasHeight + 20
    ) {
      continue;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }
}

/** Pulsing magenta ring on orphan package senders/receivers. */
export function drawOrphanRings(
  ctx: CanvasRenderingContext2D,
  entities: GameEntity[],
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
  timestamp: number
): void {
  drawPulsingRings(ctx, entities, zoom, panX, panY, canvasWidth, canvasHeight, timestamp, ORPHAN_COLOR);
}

/**
 * Draw the hover/selection highlight for a single entity. Used on the animated
 * layer so that hovering does not force a full redraw of the (cached) entities.
 */
export function drawEntityHighlight(
  ctx: CanvasRenderingContext2D,
  entity: GameEntity,
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
  selected: boolean
): void {
  const radius = Math.max(2, BASE_RADIUS * Math.min(zoom * 2000, 3));
  const screen = world2screen(entity.x, entity.y, zoom, panX, panY);
  if (
    screen.x < -radius * 2 ||
    screen.x > canvasWidth + radius * 2 ||
    screen.y < -radius * 2 ||
    screen.y > canvasHeight + radius * 2
  ) {
    return;
  }

  const color = CAT_COLORS[entity.category];

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = selected ? 20 : 12;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, radius * 1.3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (selected) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function drawLabels(
  ctx: CanvasRenderingContext2D,
  entities: GameEntity[],
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
  selectedEntity: GameEntity | null
): void {
  const fontSize = Math.max(8, Math.min(LABEL_FONT_SIZE, LABEL_FONT_SIZE * zoom * 1500));
  ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';

  const showLabelsZoom = 0.0035;

  for (const entity of entities) {
    const isSelected = selectedEntity?.id === entity.id;
    const hasCustomName = !!entity.customName?.trim();
    // Player-named buildings are always labelled (that's why they were named);
    // type labels only appear once zoomed in enough to avoid clutter.
    const showLabel =
      isSelected ||
      hasCustomName ||
      (zoom >= showLabelsZoom &&
        (entity.category === 'machine' || entity.category === 'basecore'));

    if (!showLabel) continue;

    const screen = world2screen(entity.x, entity.y, zoom, panX, panY);

    if (
      screen.x < -50 ||
      screen.x > canvasWidth + 50 ||
      screen.y < -50 ||
      screen.y > canvasHeight + 50
    ) {
      continue;
    }

    const labelY = screen.y - 10;
    const color = CAT_COLORS[entity.category];
    const text = displayName(entity);

    ctx.fillStyle = 'rgba(6, 9, 14, 0.7)';
    const nameWidth = ctx.measureText(text).width;
    ctx.fillRect(
      screen.x - nameWidth / 2 - 3,
      labelY - fontSize + 1,
      nameWidth + 6,
      fontSize + 2
    );

    ctx.fillStyle = color;
    ctx.fillText(text, screen.x, labelY);
  }
}
