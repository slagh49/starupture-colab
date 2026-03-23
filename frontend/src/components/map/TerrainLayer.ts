import { WORLD_BOUNDS } from '../../constants/mapConfig';

const TERRAIN_SIZE = 512;

function hash(x: number, y: number, seed: number): number {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h ^= (h >> 16);
  return (h & 0xffff) / 0xffff;
}

function smoothNoise(wx: number, wy: number, scale: number, seed: number): number {
  const gx = wx / scale;
  const gy = wy / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const s = (t: number): number => t * t * (3 - 2 * t);
  return (
    hash(x0, y0, seed) * (1 - s(fx)) * (1 - s(fy)) +
    hash(x0 + 1, y0, seed) * s(fx) * (1 - s(fy)) +
    hash(x0, y0 + 1, seed) * (1 - s(fx)) * s(fy) +
    hash(x0 + 1, y0 + 1, seed) * s(fx) * s(fy)
  );
}

function fbm(wx: number, wy: number): number {
  return (
    smoothNoise(wx, wy, 80000, 42) * 0.5 +
    smoothNoise(wx, wy, 40000, 7) * 0.25 +
    smoothNoise(wx, wy, 20000, 13) * 0.125 +
    smoothNoise(wx, wy, 10000, 19) * 0.0625
  );
}

interface Biome {
  th: number;
  r: number;
  g: number;
  b: number;
}

const BIOMES: Biome[] = [
  { th: 0.28, r: 14, g: 28, b: 20 },
  { th: 0.48, r: 55, g: 42, b: 18 },
  { th: 0.67, r: 90, g: 68, b: 35 },
  { th: 0.82, r: 60, g: 50, b: 60 },
  { th: 1.0, r: 80, g: 75, b: 90 },
];

function getBiomeColor(value: number): { r: number; g: number; b: number } {
  let prev = BIOMES[0];
  if (!prev) return { r: 14, g: 28, b: 20 };

  if (value <= prev.th) return { r: prev.r, g: prev.g, b: prev.b };

  for (let i = 1; i < BIOMES.length; i++) {
    const curr = BIOMES[i];
    if (!curr) continue;
    if (value <= curr.th) {
      const t = (value - prev.th) / (curr.th - prev.th);
      return {
        r: Math.round(prev.r + (curr.r - prev.r) * t),
        g: Math.round(prev.g + (curr.g - prev.g) * t),
        b: Math.round(prev.b + (curr.b - prev.b) * t),
      };
    }
    prev = curr;
  }

  const last = BIOMES[BIOMES.length - 1];
  if (!last) return { r: 80, g: 75, b: 90 };
  return { r: last.r, g: last.g, b: last.b };
}

export function createTerrainCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TERRAIN_SIZE;
  canvas.height = TERRAIN_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.createImageData(TERRAIN_SIZE, TERRAIN_SIZE);
  const data = imageData.data;

  const worldW = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
  const worldH = WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY;

  for (let py = 0; py < TERRAIN_SIZE; py++) {
    for (let px = 0; px < TERRAIN_SIZE; px++) {
      const wx = WORLD_BOUNDS.minX + (px / TERRAIN_SIZE) * worldW;
      const wy = WORLD_BOUNDS.minY + (py / TERRAIN_SIZE) * worldH;
      const value = fbm(wx, wy);
      const color = getBiomeColor(value);
      const idx = (py * TERRAIN_SIZE + px) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  terrainCanvas: HTMLCanvasElement,
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  const worldW = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
  const worldH = WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY;

  const screenX = WORLD_BOUNDS.minX * zoom + panX;
  const screenY = WORLD_BOUNDS.minY * zoom + panY;
  const screenW = worldW * zoom;
  const screenH = worldH * zoom;

  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#06090e';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(terrainCanvas, screenX, screenY, screenW, screenH);
  ctx.restore();
}

/**
 * Draws a map background image at the correct scale/position in world coordinates.
 * Used as a replacement for the procedural fbm terrain when a map image is available.
 */
export function drawTerrainImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  zoom: number,
  panX: number,
  panY: number,
  worldBounds: { minX: number; maxX: number; minY: number; maxY: number },
  canvasWidth: number,
  canvasHeight: number
): void {
  const worldW = worldBounds.maxX - worldBounds.minX;
  const worldH = worldBounds.maxY - worldBounds.minY;

  const screenX = worldBounds.minX * zoom + panX;
  const screenY = worldBounds.minY * zoom + panY;
  const screenW = worldW * zoom;
  const screenH = worldH * zoom;

  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#06090e';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, screenX, screenY, screenW, screenH);
  ctx.restore();
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.fillStyle = 'rgba(6, 9, 14, 0.35)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}
