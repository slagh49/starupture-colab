import { MapCanvas } from '../components/map/MapCanvas';
import { Legend } from '../components/ui/Legend';
import { Tooltip } from '../components/ui/Tooltip';
import { EntityDetail } from '../components/ui/EntityDetail';
import { UploadButton } from '../components/ui/UploadButton';
import { SessionSelector } from '../components/ui/SessionSelector';
import type { UseSaveDataReturn } from '../hooks/useSaveData';
import type { UseMapInteractionReturn } from '../hooks/useMapInteraction';
import styles from './MapPage.module.css';

interface Props {
  saveData: UseSaveDataReturn;
  mapInteraction: UseMapInteractionReturn;
}

export function MapPage({ saveData, mapInteraction }: Props): JSX.Element {
  const {
    sessions,
    activeSession,
    entities,
    links,
    zones,
    loading,
    error,
    uploadFile,
    selectSession,
  } = saveData;

  const {
    zoom,
    panX,
    panY,
    hoveredEntity,
    selectedEntity,
    mouseScreenX,
    mouseScreenY,
    bindCanvas,
    unbindCanvas,
    resetView,
    setSelectedEntity,
  } = mapInteraction;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <SessionSelector
          sessions={sessions}
          activeSession={activeSession}
          onSelect={selectSession}
        />
        <UploadButton onUpload={uploadFile} loading={loading} />
        {error && <span className={styles.error}>{error}</span>}
        {activeSession && (
          <span className={styles.info}>
            {entities.length} entities
          </span>
        )}
      </div>
      <div className={styles.mapContainer}>
        <MapCanvas
          entities={entities}
          links={links}
          zones={zones}
          zoom={zoom}
          panX={panX}
          panY={panY}
          hoveredEntity={hoveredEntity}
          selectedEntity={selectedEntity}
          onCanvasBind={bindCanvas}
          onCanvasUnbind={unbindCanvas}
          onResetView={resetView}
        />
        <Legend />
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
            onClose={() => setSelectedEntity(null)}
          />
        )}
      </div>
    </div>
  );
}
