import { useState } from 'react';
import { Header } from './components/ui/Header';
import { TabBar } from './components/ui/TabBar';
import type { TabId } from './components/ui/TabBar';
import { MapPage } from './pages/MapPage';
import { ProgressionPage } from './pages/ProgressionPage';
import { AdminPage } from './pages/AdminPage';
import { useSaveData } from './hooks/useSaveData';
import { useMapInteraction } from './hooks/useMapInteraction';
import styles from './App.module.css';

export function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('map');
  const saveData = useSaveData();
  const mapInteraction = useMapInteraction();

  return (
    <div className={styles.app}>
      <Header
        activeSession={saveData.activeSession}
        entities={saveData.entities}
        links={saveData.links}
        loading={saveData.loading}
        error={saveData.error}
        onUpload={saveData.uploadFile}
      />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'map' && (
          <MapPage saveData={saveData} mapInteraction={mapInteraction} />
        )}
        {activeTab === 'progression' && (
          <ProgressionPage sessionId={saveData.activeSession?.id ?? null} />
        )}
        {activeTab === 'admin' && (
          <AdminPage
            onImported={session => {
              void saveData.loadSessions();
              void saveData.selectSession(session);
              setActiveTab('map');
            }}
          />
        )}
      </div>
    </div>
  );
}
