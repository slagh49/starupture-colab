import { useState, useEffect, useMemo } from 'react';
import type { GameEntity, GameEntityItem, DroneLink } from '../../types/save.types';
import { CAT_COLORS, CAT_LABELS } from '../../constants/colors';
import { displayName, cleanRecipe } from '../../utils/format';
import { cleanItemName } from '../map/DroneLayer';
import { savesApi } from '../../services/api';
import styles from './EntityDetail.module.css';

interface Conn {
  name: string;
  item: string;
  count: number;
}

interface Props {
  entity: GameEntity;
  sessionId: string | null;
  links: DroneLink[];
  entityById: Map<string, GameEntity>;
  onClose: () => void;
}

export function EntityDetail({ entity, sessionId, links, entityById, onClose }: Props): JSX.Element {
  const color = CAT_COLORS[entity.category];
  const [items, setItems] = useState<GameEntityItem[]>([]);

  // Drone-link connections of this entity (where it sends to / receives from).
  const connections = useMemo(() => {
    const out = new Map<string, Conn>();
    const inc = new Map<string, Conn>();
    for (const l of links) {
      const cnt = l.droneCount ?? 1;
      if (l.fromEntityId === entity.id) {
        const item = cleanItemName(l.item ?? '');
        const key = l.toEntityId + '|' + item;
        const e = out.get(key);
        if (e) e.count += cnt;
        else {
          const other = entityById.get(l.toEntityId);
          out.set(key, { name: other ? displayName(other) : '?', item, count: cnt });
        }
      } else if (l.toEntityId === entity.id) {
        const item = cleanItemName(l.item ?? '');
        const key = l.fromEntityId + '|' + item;
        const e = inc.get(key);
        if (e) e.count += cnt;
        else {
          const other = entityById.get(l.fromEntityId);
          inc.set(key, { name: other ? displayName(other) : '?', item, count: cnt });
        }
      }
    }
    return { out: [...out.values()], in: [...inc.values()] };
  }, [entity.id, links, entityById]);

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
          {displayName(entity)}
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

        {connections.out.map((c, i) => (
          <DetailRow
            key={`out-${i}`}
            label={i === 0 ? 'VERS' : ''}
            value={`→ ${c.name} (${c.item} ×${c.count})`}
            valueColor={CAT_COLORS.machine}
          />
        ))}
        {connections.in.map((c, i) => (
          <DetailRow
            key={`in-${i}`}
            label={i === 0 ? 'DEPUIS' : ''}
            value={`← ${c.name} (${c.item} ×${c.count})`}
          />
        ))}
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
