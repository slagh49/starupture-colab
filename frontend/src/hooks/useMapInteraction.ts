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
  resetView: (canvasWidth: number, canvasHeight: number) => void;
  setSelectedEntity: (entity: GameEntity | null) => void;
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

  const findEntityAtScreen = useCallback(
    (sx: number, sy: number, currentZoom: number, currentPanX: number, currentPanY: number): GameEntity | null => {
      const world = screen2world(sx, sy, currentZoom, currentPanX, currentPanY);
      let closest: GameEntity | null = null;
      let closestDist = HIT_RADIUS_WORLD;
      for (const entity of entities) {
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
    [entities]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
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
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;
      const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      dragStartRef.current = { x: mx, y: my, panX, panY };
      setIsDragging(false);
    },
    [panX, panY]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
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
        setZoom(currentZoom => {
          setPanX(currentPanX => {
            setPanY(currentPanY => {
              const hit = findEntityAtScreen(mx, my, currentZoom, currentPanX, currentPanY);
              setHoveredEntity(hit);
              return currentPanY;
            });
            return currentPanX;
          });
          return currentZoom;
        });
      }
    },
    [findEntityAtScreen]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      const wasDragging = isDragging;
      dragStartRef.current = null;
      setIsDragging(false);

      if (!wasDragging && e.button === 0) {
        const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const hit = findEntityAtScreen(mx, my, zoom, panX, panY);
        setSelectedEntity(hit);
      }
    },
    [isDragging, findEntityAtScreen, zoom, panX, panY]
  );

  const handleMouseLeave = useCallback(() => {
    dragStartRef.current = null;
    setIsDragging(false);
    setHoveredEntity(null);
  }, []);

  const bindCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
      canvasRef.current = canvas;
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    },
    [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]
  );

  const unbindCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.removeEventListener('wheel', handleWheel);
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    canvasRef.current = null;
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]);

  const resetView = useCallback((canvasWidth: number, canvasHeight: number) => {
    const worldW = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
    const worldH = WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY;
    const fitZoom = Math.min(canvasWidth / worldW, canvasHeight / worldH) * 0.9;
    const clampedZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fitZoom));
    setZoom(clampedZoom);
    const centerWorldX = (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2;
    const centerWorldY = (WORLD_BOUNDS.minY + WORLD_BOUNDS.maxY) / 2;
    setPanX(canvasWidth / 2 - centerWorldX * clampedZoom);
    setPanY(canvasHeight / 2 - centerWorldY * clampedZoom);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isDragging) {
      canvas.style.cursor = 'grabbing';
    } else if (hoveredEntity) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'grab';
    }
  }, [isDragging, hoveredEntity]);

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
  };
}
