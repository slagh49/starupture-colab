import type { RailSpline } from '../../types/save.types';
import { world2screen } from '../../constants/mapConfig';

/** DroneRail reste orange (infra) ; le walkway suit l'accent du thème. */
const DRONE_RAIL_COLOR = '#ff6b35';

export function drawRails(
  ctx: CanvasRenderingContext2D,
  splines: RailSpline[],
  zoom: number,
  panX: number,
  panY: number,
  _canvasWidth: number,
  _canvasHeight: number,
  walkwayColor: string
): void {
  for (const spline of splines) {
    if (spline.points.length < 2) continue;

    const screenPoints = spline.points.map(p =>
      world2screen(p.x, p.y, zoom, panX, panY)
    );

    // Viewport culling: skip splines whose bounding box is fully off-screen.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of screenPoints) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    if (maxX < 0 || minX > _canvasWidth || maxY < 0 || minY > _canvasHeight) continue;

    const isDroneRail = spline.splineType === 'DroneRail';
    ctx.strokeStyle = isDroneRail ? DRONE_RAIL_COLOR : walkwayColor;
    ctx.lineWidth = Math.max(1, (isDroneRail ? 2 : 1.5) * zoom * 1000);
    ctx.globalAlpha = isDroneRail ? 0.8 : 0.6;

    if (!isDroneRail) {
      const dashLen = Math.max(4, 10 * zoom * 1000);
      ctx.setLineDash([dashLen, dashLen * 0.5]);
    }

    ctx.beginPath();

    const first = screenPoints[0];
    if (!first) continue;
    ctx.moveTo(first.x, first.y);

    if (screenPoints.length === 2) {
      const second = screenPoints[1];
      if (second) {
        ctx.lineTo(second.x, second.y);
      }
    } else {
      // Catmull-Rom to Bezier conversion for smooth splines
      for (let i = 0; i < screenPoints.length - 1; i++) {
        const p0 = screenPoints[Math.max(0, i - 1)];
        const p1 = screenPoints[i];
        const p2 = screenPoints[Math.min(screenPoints.length - 1, i + 1)];
        const p3 = screenPoints[Math.min(screenPoints.length - 1, i + 2)];

        if (!p0 || !p1 || !p2 || !p3) continue;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    }

    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}
