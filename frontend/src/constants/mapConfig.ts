export const WORLD_BOUNDS = {
  minX: -450000,
  maxX: 100000,
  minY: -280000,
  maxY: 80000,
};

export const ZOOM_MIN = 0.00005;
export const ZOOM_MAX = 0.02;
export const ZOOM_DEFAULT = 0.0008;
export const ZOOM_FACTOR = 1.15;

export const GRID_SPACING = 50000;
export const GRID_ZOOM_THRESHOLD = 0.0002;

export const HIT_RADIUS_WORLD = 3000;

export const world2screen = (
  wx: number,
  wy: number,
  zoom: number,
  panX: number,
  panY: number
): { x: number; y: number } => ({
  x: wx * zoom + panX,
  y: wy * zoom + panY,
});

export const screen2world = (
  sx: number,
  sy: number,
  zoom: number,
  panX: number,
  panY: number
): { x: number; y: number } => ({
  x: (sx - panX) / zoom,
  y: (sy - panY) / zoom,
});
