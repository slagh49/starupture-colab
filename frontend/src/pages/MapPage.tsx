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
import { markersApi } from '../services/api';
import { isStructural, displayName } from '../utils/format';
import type { GameEntity } from '../types/save.types';
import type { MapMarker } from '../types/marker.types';
import type { LayerState } from '../components/ui/LayerToggles';
import type { EntityCategory } from '../types/save.types';
import type { UseSaveDataReturn } from '../hooks/useSaveData';
import type { UseMapInteractionReturn } from '../hooks/useMapInteraction';
import styles from './MapPage.module.css';

interface Props {
  saveData: UseSaveDataReturn;
  mapInteraction: UseMapInteractionReturn;
  /** Accent du thème courant (hex) pour les éléments d'accent de la carte. */
  accent: string;
}

const ALL_CATEGORIES: EntityCategory[] = [
  'basecore', 'machine', 'energy', 'infra', 'antenna', 'danger', 'loot',
];

// Shown by default; the others are toggled on from the filter bar when needed.
const DEFAULT_ON: EntityCategory[] = ['basecore', 'machine'];

function createDefaultFilters(): Record<EntityCategory, boolean> {
  const filters = {} as Record<EntityCategory, boolean>;
  for (const cat of ALL_CATEGORIES) {
    filters[cat] = DEFAULT_ON.includes(cat);
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

export function MapPage({ saveData, mapInteraction, accent }: Props): JSX.Element {
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
  const [nameFilter, setNameFilter] = useState('');
  const [selectedFlowItem, setSelectedFlowItem] = useState<string | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  const loadMarkers = useCallback(async () => {
    try {
      const res = await markersApi.list();
      setMarkers(res.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void loadMarkers(); }, [loadMarkers]);

  const addMarker = useCallback(async (wx: number, wy: number) => {
    const label = window.prompt('Libellé du marqueur ?');
    if (!label?.trim()) return;
    await markersApi.create({ x: wx, y: wy, label: label.trim(), color: accent });
    await loadMarkers();
  }, [accent, loadMarkers]);

  const deleteMarker = useCallback(async (id: string) => {
    await markersApi.delete(id);
    await loadMarkers();
  }, [loadMarkers]);

  const flowItemList = useMemo(() => flowItems(links), [links]);
  const entityById = useMemo(() => new Map(entities.map(e => [e.id, e])), [entities]);

  // Diagnostic overlays computed from the FULL entity set (not the filtered one),
  // so the rings show even when the relevant category is hidden by the filters.
  const orphanEntities = useMemo(() => {
    const linked = new Set<string>();
    for (const l of links) {
      linked.add(l.fromEntityId);
      linked.add(l.toEntityId);
    }
    return entities.filter(e => e.name.includes('Package') && !linked.has(e.id));
  }, [entities, links]);

  const [layers, setLayers] = useState<LayerState>({
    terrain: true,
    drones: true,
    rails: true,
    baseZone: true,
    labels: true,
    infection: true,
    orphans: false,
    markers: true,
  });

  const toggleFilter = useCallback((cat: EntityCategory) => {
    setActiveFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const toggleLayer = useCallback((key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // A name filter takes over the category filters: the map then shows the
  // matching entities across every category. Structural tiles stay excluded;
  // the full set still feeds entityById for link lookups. When the infection
  // layer is on, infected buildings are always kept (even if their category is
  // toggled off) so they — and their red ring — are visible.
  const filteredEntities = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();
    let list = entities.filter(e => !isStructural(e));
    if (q) {
      list = list.filter(e => displayName(e).toLowerCase().includes(q));
    } else {
      list = list.filter(e => activeFilters[e.category] || (layers.infection && (e.infection ?? 0) > 0));
    }
    return list;
  }, [entities, activeFilters, nameFilter, layers.infection]);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Debounced view: avoids recomputing the visible list on every pan frame.
  const [view, setView] = useState<ViewState>({ zoom, panX, panY });
  useEffect(() => {
    const id = window.setTimeout(() => setView({ zoom, panX, panY }), 120);
    return () => window.clearTimeout(id);
  }, [zoom, panX, panY]);

  // With a name filter active, list every match (they may be off-screen);
  // otherwise restrict the list to the viewport for performance.
  const visibleEntities = useMemo(
    () => nameFilter.trim()
      ? filteredEntities
      : entitiesInView(filteredEntities, view, mapContainerRef.current),
    [filteredEntities, view, nameFilter]
  );

  const handleRecenter = useCallback(() => {
    resetView();
  }, [resetView]);

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.nameFilter}>
            <input
              type="text"
              value={nameFilter}
              onChange={e => setNameFilter(e.target.value)}
              placeholder="Filtrer par nom (ex. soufre-)"
              aria-label="Filtrer les entités par nom"
            />
            {nameFilter && (
              <button type="button" onClick={() => setNameFilter('')} aria-label="Effacer le filtre">×</button>
            )}
          </div>
          {nameFilter.trim() && (
            <div className={styles.nameFilterHint}>
              {filteredEntities.length} entité{filteredEntities.length > 1 ? 's' : ''} — la carte n'affiche que ce filtre
            </div>
          )}
          <FilterBar activeFilters={activeFilters} onToggle={toggleFilter} />
          <EntityList
            entities={visibleEntities}
            selectedEntity={selectedEntity}
            onSelect={setSelectedEntity}
          />
          {layers.markers && markers.length > 0 && (
            <div className={styles.markerSection}>
              <div className={styles.markerTitle}>MARQUEURS ({markers.length})</div>
              {markers.map(m => (
                <div key={m.id} className={styles.markerRow}>
                  <span className={styles.markerDot} style={{ backgroundColor: m.color }} />
                  <span className={styles.markerLabel}>{m.label}</span>
                  <button
                    type="button"
                    className={styles.markerDel}
                    onClick={() => void deleteMarker(m.id)}
                    title="Supprimer ce marqueur"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Map area */}
        <div className={styles.mapArea}>
          <div
            className={styles.mapContainer}
            ref={mapContainerRef}
            onContextMenu={e => {
              e.preventDefault();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const sx = e.clientX - rect.left;
              const sy = e.clientY - rect.top;
              const w = screen2world(sx, sy, zoom, panX, panY);
              void addMarker(w.x, w.y);
            }}
          >
            <MapCanvas
              entities={filteredEntities}
              links={links}
              splines={splines}
              zones={zones}
              accent={accent}
              markers={markers}
              zoom={zoom}
              panX={panX}
              panY={panY}
              hoveredEntity={hoveredEntity}
              selectedEntity={selectedEntity}
              layers={layers}
              orphanEntities={orphanEntities}
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
            <div className={styles.rightStack}>
              <Legend />
              {layers.drones && (
                <FlowFilter
                  items={flowItemList}
                  selected={selectedFlowItem}
                  onSelect={setSelectedFlowItem}
                />
              )}
            </div>
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
                links={links}
                entityById={entityById}
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
