import { useState, useEffect } from 'react';
import type { GameEntity, GameEntityItem } from '../../types/save.types';
import { CAT_COLORS, CAT_LABELS } from '../../constants/colors';
import { cleanName, cleanRecipe } from '../../utils/format';
import { savesApi } from '../../services/api';
import styles from './EntityDetail.module.css';

interface Props {
  entity: GameEntity;
  sessionId: string | null;
  onClose: () => void;
}

export function EntityDetail({ entity, sessionId, onClose }: Props): JSX.Element {
  const color = CAT_COLORS[entity.category];
  const [items, setItems] = useState<GameEntityItem[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    savesApi
      .items(sessionId, entity.id)
      .then(res => {
        if (!cancelled) setItems(res.data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, entity.id]);

  const inputs = items.filter(i => i.side === 'input');
  const outputs = items.filter(i => i.side === 'output');

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title} style={{ color }}>
          {cleanName(entity.name)}
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
          <DetailRow label="RECETTE" value={cleanRecipe(entity.recipe) ?? entity.recipe} />
        )}
        <DetailRow
          label="STATUT"
          value={entity.status.toUpperCase()}
          valueColor={entity.status === 'on' ? CAT_COLORS.machine : CAT_COLORS.danger}
        />
        {entity.electricityLevel != null && (
          <DetailRow label="ÉNERGIE" value={`x${entity.electricityLevel}`} />
        )}
        {entity.craftProgress != null && (
          <DetailRow label="PRODUCTION" value={`${Math.round(entity.craftProgress * 100)}%`} />
        )}
        {entity.priority && (
          <DetailRow label="PRIORITÉ" value={entity.priority} />
        )}
        {entity.outputFull === true && (
          <DetailRow label="SORTIE" value="PLEINE" valueColor={CAT_COLORS.energy} />
        )}
        {entity.missingItems === true && (
          <DetailRow label="MANQUE" value="INTRANTS" valueColor={CAT_COLORS.danger} />
        )}

        {inputs.length > 0 && (
          <ItemSection title="ENTRÉE" items={inputs} />
        )}
        {outputs.length > 0 && (
          <ItemSection title="SORTIE" items={outputs} />
        )}
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

interface ItemSectionProps {
  title: string;
  items: GameEntityItem[];
}

function ItemSection({ title, items }: ItemSectionProps): JSX.Element {
  return (
    <>
      {items.map((it, idx) => (
        <DetailRow
          key={`${title}-${it.item}-${idx}`}
          label={idx === 0 ? title : ''}
          value={`${it.item} ×${it.count}`}
        />
      ))}
    </>
  );
}
