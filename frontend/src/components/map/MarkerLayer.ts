import type { MapMarker } from '../../types/marker.types';
import { world2screen } from '../../constants/mapConfig';

const PIN_SIZE = 8;

export function drawMarkers(
  ctx: CanvasRenderingContext2D,
  markers: MapMarker[],
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  for (const m of markers) {
    const s = world2screen(m.x, m.y, zoom, panX, panY);
    if (s.x < -PIN_SIZE || s.x > canvasWidth + PIN_SIZE ||
        s.y < -PIN_SIZE * 2 || s.y > canvasHeight + PIN_SIZE) {
      continue;
    }

    // Pin shape (inversé : pointe en bas)
    const r = Math.max(PIN_SIZE, Math.min(PIN_SIZE * 1.5, PIN_SIZE * zoom * 2000));
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y - r, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - r * 0.35, s.y - r * 0.55);
    ctx.lineTo(s.x + r * 0.35, s.y - r * 0.55);
    ctx.closePath();
    ctx.fill();

    // Label
    const fontSize = Math.max(9, Math.min(12, 10 * zoom * 1200));
    ctx.font = `bold ${fontSize}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeText(m.label, s.x, s.y - r * 1.5);
    ctx.fillText(m.label, s.x, s.y - r * 1.5);
    ctx.textAlign = 'start';
  }
}
