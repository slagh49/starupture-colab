import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameEntity, GameEntityItem, DroneLink } from '../../types/save.types';
import { CAT_COLORS } from '../../constants/colors';
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
  const { t } = useTranslation();
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
          aria-label={t('entityDetail.closeAria')}
        >
          x
        </button>
      </div>
      <div className={styles.body}>
        <DetailRow label={t('entityDetail.type')} value={t('category.' + entity.category)} valueColor={color} />
        <DetailRow
          label="X / Y / Z"
          value={`${Math.round(entity.x)} / ${Math.round(entity.y)} / ${Math.round(entity.z)}`}
        />
        <DetailRow
          label={t('entityDetail.infection')}
          value={`${entity.infection}%`}
          valueColor={entity.infection > 0 ? CAT_COLORS.danger : undefined}
        />
        {entity.recipe && (
          <DetailRow label={t('entityDetail.recipe')} value={cleanRecipe(entity.recipe) ?? entity.recipe} />
        )}
        <DetailRow
          label={t('entityDetail.status')}
          value={entity.status.toUpperCase()}
          valueColor={entity.status === 'on' ? CAT_COLORS.machine : CAT_COLORS.danger}
        />
        {entity.electricityLevel != null && (
          <DetailRow label={t('entityDetail.energy')} value={`x${entity.electricityLevel}`} />
        )}
        {entity.craftProgress != null && (
          <DetailRow label={t('entityDetail.production')} value={`${Math.round(entity.craftProgress * 100)}%`} />
        )}
        {entity.priority && (
          <DetailRow label={t('entityDetail.priority')} value={entity.priority} />
        )}
        {entity.outputFull === true && (
          <DetailRow label={t('entityDetail.output')} value={t('entityDetail.full')} valueColor={CAT_COLORS.energy} />
        )}
        {entity.missingItems === true && (
          <DetailRow label={t('entityDetail.missing')} value={t('entityDetail.missingInputs')} valueColor={CAT_COLORS.danger} />
        )}

        {inputs.length > 0 && (
          <ItemSection title={t('entityDetail.input')} items={inputs} />
        )}
        {outputs.length > 0 && (
          <ItemSection title={t('entityDetail.output')} items={outputs} />
        )}

        {connections.out.map((c, i) => (
          <DetailRow
            key={`out-${i}`}
            label={i === 0 ? t('entityDetail.to') : ''}
            value={`→ ${c.name} (${c.item} ×${c.count})`}
            valueColor={CAT_COLORS.machine}
          />
        ))}
        {connections.in.map((c, i) => (
          <DetailRow
            key={`in-${i}`}
            label={i === 0 ? t('entityDetail.from') : ''}
            value={`← ${c.name} (${c.item} ×${c.count})`}
          />
        ))}
        {entity.name.includes('Package') &&
          connections.out.length === 0 &&
          connections.in.length === 0 && (
            <DetailRow label={t('entityDetail.link')} value={t('entityDetail.notConfigured')} valueColor={CAT_COLORS.danger} />
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
