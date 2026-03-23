import type { GameEntity } from '../../types/save.types';
import { CAT_COLORS, CAT_LABELS } from '../../constants/colors';
import styles from './EntityDetail.module.css';

interface Props {
  entity: GameEntity;
  onClose: () => void;
}

export function EntityDetail({ entity, onClose }: Props): JSX.Element {
  const color = CAT_COLORS[entity.category];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title} style={{ color }}>
          {entity.name}
        </span>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          type="button"
          aria-label="Close detail panel"
        >
          x
        </button>
      </div>
      <div className={styles.body}>
        <DetailRow label="Game ID" value={entity.gameId} />
        <DetailRow
          label="Category"
          value={CAT_LABELS[entity.category]}
          valueColor={color}
        />
        <DetailRow
          label="Position"
          value={`X: ${Math.round(entity.x)} Y: ${Math.round(entity.y)} Z: ${Math.round(entity.z)}`}
        />
        <DetailRow label="Recipe" value={entity.recipe ?? 'None'} />
        <DetailRow
          label="Infection"
          value={`${entity.infection}%`}
          valueColor={entity.infection > 0 ? '#ff3030' : undefined}
        />
        <DetailRow
          label="Status"
          value={entity.status.toUpperCase()}
          valueColor={entity.status === 'on' ? '#39ff14' : '#ff3030'}
        />
        <DetailRow
          label="Foundable"
          value={entity.foundable ? 'Yes' : 'No'}
        />
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function DetailRow({ label, value, valueColor }: DetailRowProps): JSX.Element {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
}
