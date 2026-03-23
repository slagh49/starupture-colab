import type { GameEntity } from '../../types/save.types';
import { CAT_COLORS } from '../../constants/colors';
import { world2screen } from '../../constants/mapConfig';

const BASE_RADIUS = 5;
const LABEL_FONT_SIZE = 10;
/** Infection ring color from CAT_COLORS.danger */
const INFECTION_COLOR = '#ff3030';

export function drawEntities(
  ctx: CanvasRenderingContext2D,
  entities: GameEntity[],
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
  hoveredEntity: GameEntity | null,
  selectedEntity: GameEntity | null,
  timestamp: number
): void {
  const radius = Math.max(2, BASE_RADIUS * Math.min(zoom * 2000, 3));

  for (const entity of entities) {
    const screen = world2screen(entity.x, entity.y, zoom, panX, panY);

    if (
      screen.x < -radius * 2 ||
      screen.x > canvasWidth + radius * 2 ||
      screen.y < -radius * 2 ||
      screen.y > canvasHeight + radius * 2
    ) {
      continue;
    }

    const color = CAT_COLORS[entity.category];
    const isHovered = hoveredEntity?.id === entity.id;
    const isSelected = selectedEntity?.id === entity.id;
    const isOff = entity.status === 'off';

    // Infection ring pulsating (SR-009)
    if (entity.infection > 0) {
      const pulseSpeed = 1500;
      const pulseAlpha =
        0.3 + 0.5 * Math.abs(Math.sin(timestamp / pulseSpeed * Math.PI));
      const infectionIntensity = Math.min(entity.infection / 100, 1);
      const ringRadius = radius * 1.8 + radius * 0.3 * Math.sin(timestamp / pulseSpeed * Math.PI);

      ctx.save();
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = INFECTION_COLOR;
      ctx.lineWidth = Math.max(1.5, 2.5 * infectionIntensity);
      ctx.globalAlpha = pulseAlpha * infectionIntensity;
      ctx.stroke();
      ctx.restore();
    }

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
    ctx.globalAlpha = isOff ? 0.4 : 1;
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

  const showLabelsZoom = 0.001;

  for (const entity of entities) {
    const isSelected = selectedEntity?.id === entity.id;
    const showLabel =
      isSelected ||
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

    ctx.fillStyle = 'rgba(6, 9, 14, 0.7)';
    const nameWidth = ctx.measureText(entity.name).width;
    ctx.fillRect(
      screen.x - nameWidth / 2 - 3,
      labelY - fontSize + 1,
      nameWidth + 6,
      fontSize + 2
    );

    ctx.fillStyle = color;
    ctx.fillText(entity.name, screen.x, labelY);

    if (entity.recipe) {
      const recipeY = labelY + fontSize + 2;
      const recipeText = entity.recipe;
      const recipeWidth = ctx.measureText(recipeText).width;

      ctx.fillStyle = 'rgba(6, 9, 14, 0.7)';
      ctx.fillRect(
        screen.x - recipeWidth / 2 - 3,
        recipeY - fontSize + 1,
        recipeWidth + 6,
        fontSize + 2
      );

      ctx.fillStyle = '#aab0bc';
      ctx.fillText(recipeText, screen.x, recipeY);
    }
  }
}
