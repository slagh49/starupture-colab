import styles from './LayerToggles.module.css';

export interface LayerState {
  terrain: boolean;
  drones: boolean;
  rails: boolean;
  baseZone: boolean;
  labels: boolean;
  infection: boolean;
  orphans: boolean;
}

interface LayerDef {
  key: keyof LayerState;
  label: string;
  icon: string;
}

const LAYERS: LayerDef[] = [
  { key: 'terrain',  label: 'TERRAIN',     icon: '▦' },
  { key: 'drones',   label: 'FLUX DRONES', icon: '⇢' },
  { key: 'rails',    label: 'RAILS',       icon: '═' },
  { key: 'baseZone', label: 'ZONE BASE',   icon: '□' },
  { key: 'labels',   label: 'LABELS',      icon: 'A' },
  { key: 'infection', label: 'INFECTION',  icon: '☣' },
  { key: 'orphans',  label: 'ORPHELINS', icon: '⚠' },
];

interface Props {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
}

export function LayerToggles({ layers, onToggle }: Props): JSX.Element {
  return (
    <div className={styles.container}>
      {LAYERS.map(layer => {
        const active = layers[layer.key];
        return (
          <button
            key={layer.key}
            type="button"
            className={`${styles.toggle} ${active ? styles.active : ''}`}
            onClick={() => onToggle(layer.key)}
            title={layer.label}
          >
            <span className={styles.icon}>{layer.icon}</span>
            <span className={styles.label}>{layer.label}</span>
          </button>
        );
      })}
    </div>
  );
}
