import { memo, useMemo, useState } from 'react';
import type { GameEntity, EntityCategory } from '../../types/save.types';
import { CAT_COLORS, CAT_LABELS } from '../../constants/colors';
import { displayName } from '../../utils/format';
import styles from './EntityList.module.css';

interface Props {
  entities: GameEntity[];
  selectedEntity: GameEntity | null;
  onSelect: (entity: GameEntity) => void;
}

const ORDER: EntityCategory[] = [
  'basecore', 'machine', 'energy', 'infra', 'antenna', 'danger', 'loot',
];

// Cap on rows rendered per expanded group (a single group can hold thousands).
const PER_GROUP = 200;

function EntityListBase({ entities, selectedEntity, onSelect }: Props): JSX.Element {
  const groups = useMemo(() => {
    const map = new Map<EntityCategory, GameEntity[]>();
    for (const e of entities) {
      const arr = map.get(e.category);
      if (arr) arr.push(e);
      else map.set(e.category, [e]);
    }
    return map;
  }, [entities]);

  const [expanded, setExpanded] = useState<Set<EntityCategory>>(new Set());

  const toggle = (cat: EntityCategory): void => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        ENTITES
        <span className={styles.count}>{entities.length}</span>
      </div>
      <div className={styles.list}>
        {ORDER.filter(cat => groups.has(cat)).map(cat => {
          const items = groups.get(cat)!;
          const open = expanded.has(cat);
          return (
            <div key={cat}>
              <button
                type="button"
                className={styles.group}
                onClick={() => toggle(cat)}
              >
                <span className={styles.chevron}>{open ? '▾' : '▸'}</span>
                <span className={styles.dot} style={{ backgroundColor: CAT_COLORS[cat] }} />
                <span className={styles.groupName}>{CAT_LABELS[cat]}</span>
                <span className={styles.count}>{items.length}</span>
              </button>
              {open && (
                <div className={styles.groupItems}>
                  {items.slice(0, PER_GROUP).map(entity => {
                    const isSelected = selectedEntity?.id === entity.id;
                    return (
                      <button
                        key={entity.id}
                        type="button"
                        className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                        onClick={() => onSelect(entity)}
                      >
                        <span className={styles.name}>{displayName(entity)}</span>
                        {entity.category === 'machine' && entity.status === 'on' && (
                          <span className={styles.badgeOn}>ON</span>
                        )}
                      </button>
                    );
                  })}
                  {items.length > PER_GROUP && (
                    <div className={styles.more}>
                      +{(items.length - PER_GROUP).toLocaleString('fr-FR')} — filtrez pour affiner
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const EntityList = memo(EntityListBase);
