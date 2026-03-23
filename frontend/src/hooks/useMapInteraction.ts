import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameEntity } from '../types/save.types';
import {
  screen2world,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_DEFAULT,
  ZOOM_FACTOR,
  HIT_RADIUS_WORLD,
  WORLD_BOUNDS,
} from '../constants/mapConfig';

export interface MapInteractionState {
  zoom: number;
  panX: number;
  panY: number;
  hoveredEntity: GameEntity | null;
  selectedEntity: GameEntity | null;
  mouseScreenX: number;
  mouseScreenY: number;
  isDragging: boolean;
}

interface MapInteractionActions {
  bindCanvas: (canvas: HTMLCanvasElement) => void;
  unbindCanvas: () => void;
  resetView: (canvasWidth?: number, canvasHeight?: number) => void;
  setSelectedEntity: (entity: GameEntity | null) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  mouseWorldX: number;
  mouseWorldY: number;
}

export type UseMapInteractionReturn = MapInteractionState & MapInteractionActions;

export function useMapInteraction(
  entities: GameEntity[]
): UseMapInteractionReturn {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [hoveredEntity, setHoveredEntity] = useState<GameEntity | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<GameEntity | null>(null);
  const [mouseScreenX, setMouseScreenX] = useState(0);
  const [mouseScreenY, setMouseScreenY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;
  const stateRef = useRef({ zoom, panX, panY, isDragging });
  stateRef.current = { zoom, panX, panY, isDragging };

  const findEntityAtScreen = useCallback(
    (sx: number, sy: number, currentZoom: number, currentPanX: number, currentPanY: number): GameEntity | null => {
      const world = screen2world(sx, sy, currentZoom, currentPanX, currentPanY);
      let closest: GameEntity | null = null;
      let closestDist = HIT_RADIUS_WORLD;
      for (const entity of entitiesRef.current) {
        const dx = entity.x - world.x;
        const dy = entity.y - world.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = entity;
        }
      }
      return closest;
    },
    []
  );

  const bindCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
      canvasRef.current = canvas;

      const onWheel = (e: WheelEvent): void => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        setZoom(prevZoom => {
          const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
          const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevZoom * factor));
          const ratio = newZoom / prevZoom;
          setPanX(prevPanX => mx - ratio * (mx - prevPanX));
          setPanY(prevPanY => my - ratio * (my - prevPanY));
          return newZoom;
        });
      };

      const onMouseDown = (e: MouseEvent): void => {
        if (e.button !== 0) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        dragStartRef.current = {
          x: mx,
          y: my,
          panX: stateRef.current.panX,
          panY: stateRef.current.panY,
        };
        setIsDragging(false);
      };

      const onMouseMove = (e: MouseEvent): void => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setMouseScreenX(mx);
        setMouseScreenY(my);

        if (dragStartRef.current) {
          const dx = mx - dragStartRef.current.x;
          const dy = my - dragStartRef.current.y;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            setIsDragging(true);
          }
          setPanX(dragStartRef.current.panX + dx);
          setPanY(dragStartRef.current.panY + dy);
        } else {
          const { zoom: z, panX: px, panY: py } = stateRef.current;
          const hit = findEntityAtScreen(mx, my, z, px, py);
          setHoveredEntity(hit);
        }
      };

      const onMouseUp = (e: MouseEvent): void => {
        const wasDragging = stateRef.current.isDragging;
        dragStartRef.current = null;
        setIsDragging(false);

        if (!wasDragging && e.button === 0) {
          const rect = canvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const { zoom: z, panX: px, panY: py } = stateRef.current;
          const hit = findEntityAtScreen(mx, my, z, px, py);
          setSelectedEntity(hit);
        }
      };

      const onMouseLeave = (): void => {
        dragStartRef.current = null;
        setIsDragging(false);
        setHoveredEntity(null);
      };

      canvas.addEventListener('wheel', onWheel, { passive: false });
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mouseleave', onMouseLeave);

      // Store for cleanup
      (canvas as unknown as Record<string, unknown>).__listeners = {
        onWheel,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave,
      };
    },
    [findEntityAtScreen]
  );

  const unbindCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const listeners = (canvas as unknown as Record<string, unknown>).__listeners as {
      onWheel: (e: WheelEvent) => void;
      onMouseDown: (e: MouseEvent) => void;
      onMouseMove: (e: MouseEvent) => void;
      onMouseUp: (e: MouseEvent) => void;
      onMouseLeave: () => void;
    } | undefined;
    if (listeners) {
      canvas.removeEventListener('wheel', listeners.onWheel);
      canvas.removeEventListener('mousedown', listeners.onMouseDown);
      canvas.removeEventListener('mousemove', listeners.onMouseMove);
      canvas.removeEventListener('mouseup', listeners.onMouseUp);
      canvas.removeEventListener('mouseleave', listeners.onMouseLeave);
    }
    canvasRef.current = null;
  }, []);

  const zoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    setZoom(prev => {
      const next = Math.min(ZOOM_MAX, prev * ZOOM_FACTOR);
      const ratio = next / prev;
      setPanX(px => cx - ratio * (cx - px));
      setPanY(py => cy - ratio * (cy - py));
      return next;
    });
  }, []);

  const zoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    setZoom(prev => {
      const next = Math.max(ZOOM_MIN, prev / ZOOM_FACTOR);
      const ratio = next / prev;
      setPanX(px => cx - ratio * (cx - px));
      setPanY(py => cy - ratio * (cy - py));
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
    setZoom(clampedZoom);
    const centerWorldX = (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2;
    const centerWorldY = (WORLD_BOUNDS.minY + WORLD_BOUNDS.maxY) / 2;
    setPanX(cw / 2 - centerWorldX * clampedZoom);
    setPanY(ch / 2 - centerWorldY * clampedZoom);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (stateRef.current.isDragging) {
      canvas.style.cursor = 'grabbing';
    } else if (hoveredEntity) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'grab';
    }
  }, [isDragging, hoveredEntity]);

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
    bindCanvas,
    unbindCanvas,
    resetView,
    setSelectedEntity,
    zoomIn,
    zoomOut,
    mouseWorldX: worldPos.x,
    mouseWorldY: worldPos.y,
  };
}
