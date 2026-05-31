import { useState, useMemo, useCallback } from 'react';
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
            entities={filteredEntities}
            selectedEntity={selectedEntity}
            onSelect={setSelectedEntity}
          />
        </aside>

        {/* Map area */}
        <div className={styles.mapArea}>
          <div className={styles.mapContainer}>
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
