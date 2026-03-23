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
        <DetailRow label="TYPE" value={CAT_LABELS[entity.category]} valueColor={color} />
        <DetailRow
          label="X / Y / Z"
          value={`${Math.round(entity.x)} / ${Math.round(entity.y)} / ${Math.round(entity.z)}`}
        />
        <DetailRow
          label="INFECT."
          value={`${entity.infection}%`}
          valueColor={entity.infection > 0 ? CAT_COLORS.danger : undefined}
        />
        {entity.recipe && (
          <DetailRow label="RECETTE" value={entity.recipe} />
        )}
        <DetailRow
          label="STATUT"
          value={entity.status.toUpperCase()}
          valueColor={entity.status === 'on' ? CAT_COLORS.machine : CAT_COLORS.danger}
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
