import { useState, useCallback, useRef } from 'react';
import type { GameEntity } from '../types/save.types';
import {
  screen2world,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_DEFAULT,
  ZOOM_FACTOR,
  WORLD_BOUNDS,
} from '../constants/mapConfig';

export interface UseMapInteractionReturn {
  zoom: number;
  panX: number;
  panY: number;
  hoveredEntity: GameEntity | null;
  selectedEntity: GameEntity | null;
  mouseScreenX: number;
  mouseScreenY: number;
  isDragging: boolean;
  setZoom: (fn: (prev: number) => number) => void;
  setPanX: (fn: (prev: number) => number) => void;
  setPanY: (fn: (prev: number) => number) => void;
  setHoveredEntity: (entity: GameEntity | null) => void;
  setSelectedEntity: (entity: GameEntity | null) => void;
  setMouseScreenX: (x: number) => void;
  setMouseScreenY: (y: number) => void;
  setIsDragging: (v: boolean) => void;
  resetView: (canvasWidth?: number, canvasHeight?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  mouseWorldX: number;
  mouseWorldY: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useMapInteraction(): UseMapInteractionReturn {
  const [zoom, setZoomState] = useState(ZOOM_DEFAULT);
  const [panX, setPanXState] = useState(0);
  const [panY, setPanYState] = useState(0);
  const [hoveredEntity, setHoveredEntity] = useState<GameEntity | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<GameEntity | null>(null);
  const [mouseScreenX, setMouseScreenX] = useState(0);
  const [mouseScreenY, setMouseScreenY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setZoom = useCallback((fn: (prev: number) => number) => {
    setZoomState(fn);
  }, []);

  const setPanX = useCallback((fn: (prev: number) => number) => {
    setPanXState(fn);
  }, []);

  const setPanY = useCallback((fn: (prev: number) => number) => {
    setPanYState(fn);
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState(prev => {
      const next = Math.min(ZOOM_MAX, prev * ZOOM_FACTOR);
      const canvas = canvasRef.current;
      if (canvas) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const ratio = next / prev;
        setPanXState(px => cx - ratio * (cx - px));
        setPanYState(py => cy - ratio * (cy - py));
      }
      return next;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState(prev => {
      const next = Math.max(ZOOM_MIN, prev / ZOOM_FACTOR);
      const canvas = canvasRef.current;
      if (canvas) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const ratio = next / prev;
        setPanXState(px => cx - ratio * (cx - px));
        setPanYState(py => cy - ratio * (cy - py));
      }
      return next;
    });
  }, []);

  const resetView = useCallback((canvasWidth?: number, canvasHeight?: number) => {
    const canvas = canvasRef.current;
    const cw = canvasWidth ?? canvas?.width ?? 800;
    const ch = canvasHeight ?? canvas?.height ?? 600;
    const worldW = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
    const worldH = WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY;
    const fitZoom = Math.min(cw / worldW, ch / worldH) * 0.9;
    const clampedZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fitZoom));
    setZoomState(clampedZoom);
    const centerWorldX = (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2;
    const centerWorldY = (WORLD_BOUNDS.minY + WORLD_BOUNDS.maxY) / 2;
    setPanXState(cw / 2 - centerWorldX * clampedZoom);
    setPanYState(ch / 2 - centerWorldY * clampedZoom);
  }, []);

  const worldPos = screen2world(mouseScreenX, mouseScreenY, zoom, panX, panY);

  return {
    zoom,
    panX,
    panY,
    hoveredEntity,
    selectedEntity,
    mouseScreenX,
    mouseScreenY,
    isDragging,
    setZoom,
    setPanX,
    setPanY,
    setHoveredEntity,
    setSelectedEntity,
    setMouseScreenX,
    setMouseScreenY,
    setIsDragging,
    resetView,
    zoomIn,
    zoomOut,
    mouseWorldX: worldPos.x,
    mouseWorldY: worldPos.y,
    canvasRef,
  };
}
