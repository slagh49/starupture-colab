import { useState, useEffect } from 'react';
import { Header } from './components/ui/Header';
import { TabBar } from './components/ui/TabBar';
import type { TabId } from './components/ui/TabBar';
import { MapPage } from './pages/MapPage';
import { ProgressionPage } from './pages/ProgressionPage';
import { KanbanPage } from './pages/KanbanPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { useSaveData } from './hooks/useSaveData';
import { useMapInteraction } from './hooks/useMapInteraction';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { THEME_ACCENTS, type ThemeId } from './constants/themes';
import type { AuthUser } from './services/api';
import styles from './App.module.css';

export function App(): JSX.Element {
  const auth = useAuth();
  const { theme, setTheme } = useTheme();

  if (!auth.ready) {
    return <div className={styles.loading}>Chargement…</div>;
  }
  if (!auth.user) {
    return <LoginPage onLogin={auth.login} />;
  }
  return (
    <AuthedApp
      user={auth.user}
      onLogout={auth.logout}
      theme={theme}
      onThemeChange={setTheme}
    />
  );
}

interface AuthedProps {
  user: AuthUser;
  onLogout: () => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

function AuthedApp({ user, onLogout, theme, onThemeChange }: AuthedProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('map');
  const saveData = useSaveData();
  const mapInteraction = useMapInteraction();
  const isAdmin = user.role === 'ADMIN';

  // A non-admin must never sit on the admin tab.
  useEffect(() => {
    if (!isAdmin && activeTab === 'admin') {
      setActiveTab('map');
    }
  }, [isAdmin, activeTab]);

  return (
    <div className={styles.app}>
      <Header
        activeSession={saveData.activeSession}
        entities={saveData.entities}
        links={saveData.links}
        loading={saveData.loading}
        error={saveData.error}
        onUpload={saveData.uploadFile}
        username={user.username}
        onLogout={onLogout}
        theme={theme}
        onThemeChange={onThemeChange}
      />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
      <div className={styles.content}>
        {activeTab === 'map' && (
          <MapPage saveData={saveData} mapInteraction={mapInteraction} accent={THEME_ACCENTS[theme]} />
        )}
        {activeTab === 'progression' && (
          <ProgressionPage sessionId={saveData.activeSession?.id ?? null} />
        )}
        {activeTab === 'todo' && <KanbanPage />}
        {activeTab === 'admin' && isAdmin && (
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
