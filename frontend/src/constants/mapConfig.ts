export const WORLD_BOUNDS = {
  minX: -400000,
  maxX: 50000,
  minY: -300000,
  maxY: 450000,
};

/**
 * Optional map background image configuration.
 * Set `path` to the URL/path of the image to use it instead of the procedural fbm terrain.
 * `bounds` defines the world-coordinate rectangle the image covers.
 */
export interface MapImageConfig {
  path: string;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export const MAP_IMAGE: MapImageConfig | null = {
  path: '/map.png',
  bounds: {
    minX: -400000,
    maxX: 50000,
    minY: -300000,
    maxY: 450000,
  },
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
