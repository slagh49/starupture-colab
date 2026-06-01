import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { MapCanvas } from '../components/map/MapCanvas';
import { Legend } from '../components/ui/Legend';
import { Tooltip } from '../components/ui/Tooltip';
import { EntityDetail } from '../components/ui/EntityDetail';
import { FilterBar } from '../components/ui/FilterBar';
import { EntityList } from '../components/ui/EntityList';
import { LayerToggles } from '../components/ui/LayerToggles';
import { ZoomControls } from '../components/ui/ZoomControls';
import { CoordinateBar } from '../components/ui/CoordinateBar';
import { FlowFilter } from '../components/ui/FlowFilter';
import { flowItems } from '../components/map/DroneLayer';
import { screen2world, WORLD_BOUNDS } from '../constants/mapConfig';
import { isStructural } from '../utils/format';
import type { GameEntity } from '../types/save.types';
import type { LayerState } from '../components/ui/LayerToggles';
import type { EntityCategory } from '../types/save.types';
import type { UseSaveDataReturn } from '../hooks/useSaveData';
import type { UseMapInteractionReturn } from '../hooks/useMapInteraction';
import styles from './MapPage.module.css';

interface Props {
  saveData: UseSaveDataReturn;
  mapInteraction: UseMapInteractionReturn;
}

const ALL_CATEGORIES: EntityCategory[] = [
  'basecore', 'machine', 'energy', 'infra', 'antenna', 'danger', 'loot',
];

function createDefaultFilters(): Record<EntityCategory, boolean> {
  const filters = {} as Record<EntityCategory, boolean>;
  for (const cat of ALL_CATEGORIES) {
    filters[cat] = true;
  }
  return filters;
}

interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

/** Keep only entities whose world position falls inside the current viewport.
 *  When the view covers (almost) the whole world, return all of them. */
function entitiesInView(
  entities: GameEntity[],
  view: ViewState,
  container: HTMLElement | null
): GameEntity[] {
  if (!container) return entities;
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return entities;

  const tl = screen2world(0, 0, view.zoom, view.panX, view.panY);
  const br = screen2world(w, h, view.zoom, view.panX, view.panY);
  const minX = Math.min(tl.x, br.x);
  const maxX = Math.max(tl.x, br.x);
  const minY = Math.min(tl.y, br.y);
  const maxY = Math.max(tl.y, br.y);

  const worldW = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
  const worldH = WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY;
  if (maxX - minX >= worldW * 0.9 && maxY - minY >= worldH * 0.9) {
    return entities;
  }
  return entities.filter(e => e.x >= minX && e.x <= maxX && e.y >= minY && e.y <= maxY);
}

export function MapPage({ saveData, mapInteraction }: Props): JSX.Element {
  const {
    entities,
    links,
    splines,
    zones,
  } = saveData;

  const {
    zoom,
    panX,
    panY,
    hoveredEntity,
    selectedEntity,
    mouseScreenX,
    mouseScreenY,
    mouseWorldX,
    mouseWorldY,
    setZoom,
    setPanX,
    setPanY,
    setHoveredEntity,
    setMouseScreenX,
    setMouseScreenY,
    setIsDragging,
    resetView,
    setSelectedEntity,
    zoomIn,
    zoomOut,
  } = mapInteraction;

  const [activeFilters, setActiveFilters] = useState<Record<EntityCategory, boolean>>(createDefaultFilters);
  const [selectedFlowItem, setSelectedFlowItem] = useState<string | null>(null);

  const flowItemList = useMemo(() => flowItems(links), [links]);

  const [layers, setLayers] = useState<LayerState>({
    terrain: true,
    drones: true,
    rails: true,
    baseZone: true,
    labels: true,
  });

  const toggleFilter = useCallback((cat: EntityCategory) => {
    setActiveFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const toggleLayer = useCallback((key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const filteredEntities = useMemo(
    () => entities.filter(e => activeFilters[e.category]),
    [entities, activeFilters]
  );

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Debounced view: avoids recomputing the visible list on every pan frame.
  const [view, setView] = useState<ViewState>({ zoom, panX, panY });
  useEffect(() => {
    const id = window.setTimeout(() => setView({ zoom, panX, panY }), 120);
    return () => window.clearTimeout(id);
  }, [zoom, panX, panY]);

  // The list excludes structural tiles (platforms/rails) — the map keeps them.
  const listEntities = useMemo(
    () => filteredEntities.filter(e => !isStructural(e)),
    [filteredEntities]
  );

  const visibleEntities = useMemo(
    () => entitiesInView(listEntities, view, mapContainerRef.current),
    [listEntities, view]
  );

  const handleRecenter = useCallback(() => {
    resetView();
  }, [resetView]);

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <FilterBar activeFilters={activeFilters} onToggle={toggleFilter} />
          <EntityList
            entities={visibleEntities}
            selectedEntity={selectedEntity}
            onSelect={setSelectedEntity}
          />
        </aside>

        {/* Map area */}
        <div className={styles.mapArea}>
          <div className={styles.mapContainer} ref={mapContainerRef}>
            <MapCanvas
              entities={filteredEntities}
              links={links}
              splines={splines}
              zones={zones}
              zoom={zoom}
              panX={panX}
              panY={panY}
              hoveredEntity={hoveredEntity}
              selectedEntity={selectedEntity}
              layers={layers}
              selectedFlowItem={selectedFlowItem}
              setZoom={setZoom}
              setPanX={setPanX}
              setPanY={setPanY}
              setHoveredEntity={setHoveredEntity}
              setSelectedEntity={setSelectedEntity}
              setMouseScreenX={setMouseScreenX}
              setMouseScreenY={setMouseScreenY}
              setIsDragging={setIsDragging}
              onResetView={resetView}
            />

            <LayerToggles layers={layers} onToggle={toggleLayer} />
            {layers.drones && (
              <FlowFilter
                items={flowItemList}
                selected={selectedFlowItem}
                onSelect={setSelectedFlowItem}
              />
            )}
            <Legend />
            <ZoomControls
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onRecenter={handleRecenter}
              onFitAll={handleRecenter}
            />

            {hoveredEntity && !selectedEntity && (
              <Tooltip
                entity={hoveredEntity}
                screenX={mouseScreenX}
                screenY={mouseScreenY}
              />
            )}

            {selectedEntity && (
              <EntityDetail
                entity={selectedEntity}
                sessionId={saveData.activeSession?.id ?? null}
                onClose={() => setSelectedEntity(null)}
              />
            )}
          </div>

          <CoordinateBar worldX={mouseWorldX} worldY={mouseWorldY} />
        </div>
      </div>
    </div>
  );
}
