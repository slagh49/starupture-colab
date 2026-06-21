import { useTranslation } from 'react-i18next';
import styles from './LayerToggles.module.css';

export interface LayerState {
  terrain: boolean;
  drones: boolean;
  rails: boolean;
  baseZone: boolean;
  labels: boolean;
  infection: boolean;
  orphans: boolean;
  markers: boolean;
}

interface LayerDef {
  key: keyof LayerState;
  labelKey: string;
  icon: string;
}

const LAYERS: LayerDef[] = [
  { key: 'terrain',  labelKey: 'layers.terrain',  icon: '▦' },
  { key: 'drones',   labelKey: 'layers.drones',   icon: '⇢' },
  { key: 'rails',    labelKey: 'layers.rails',    icon: '═' },
  { key: 'baseZone', labelKey: 'layers.baseZone', icon: '□' },
  { key: 'labels',   labelKey: 'layers.labels',   icon: 'A' },
  { key: 'infection', labelKey: 'layers.infection', icon: '☣' },
  { key: 'orphans',  labelKey: 'layers.orphans',  icon: '⚠' },
  { key: 'markers',  labelKey: 'layers.markers',  icon: '📌' },
];

interface Props {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
}

export function LayerToggles({ layers, onToggle }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      {LAYERS.map(layer => {
        const active = layers[layer.key];
        const label = t(layer.labelKey);
        return (
          <button
            key={layer.key}
            type="button"
            className={`${styles.toggle} ${active ? styles.active : ''}`}
            onClick={() => onToggle(layer.key)}
            title={label}
          >
            <span className={styles.icon}>{layer.icon}</span>
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
