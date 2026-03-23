import { useState } from 'react';
import { Header } from './components/ui/Header';
import { TabBar } from './components/ui/TabBar';
import { MapPage } from './pages/MapPage';
import { ProductionPage } from './pages/ProductionPage';
import { useSaveData } from './hooks/useSaveData';
import { useMapInteraction } from './hooks/useMapInteraction';
import styles from './App.module.css';

type TabId = 'map' | 'production';

export function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('map');
  const saveData = useSaveData();
  const mapInteraction = useMapInteraction(saveData.entities);

  return (
    <div className={styles.app}>
      <Header
        sessions={saveData.sessions}
        activeSession={saveData.activeSession}
        entities={saveData.entities}
        links={saveData.links}
        loading={saveData.loading}
        error={saveData.error}
        onUpload={saveData.uploadFile}
        onSelectSession={saveData.selectSession}
      />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'map' ? (
          <MapPage saveData={saveData} mapInteraction={mapInteraction} />
        ) : (
          <ProductionPage
            entities={saveData.entities}
            links={saveData.links}
          />
        )}
      </div>
    </div>
  );
}
