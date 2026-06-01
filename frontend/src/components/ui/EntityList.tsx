import { memo, useMemo, useState } from 'react';
import type { GameEntity, EntityCategory } from '../../types/save.types';
import { CAT_COLORS, CAT_LABELS } from '../../constants/colors';
import { cleanName, displayName } from '../../utils/format';
import styles from './EntityList.module.css';

interface Props {
  entities: GameEntity[];
  selectedEntity: GameEntity | null;
  onSelect: (entity: GameEntity) => void;
}

const ORDER: EntityCategory[] = [
  'basecore', 'machine', 'energy', 'infra', 'antenna', 'danger', 'loot',
];

// Cap on rows rendered per expanded type.
const PER_TYPE = 200;

function EntityListBase({ entities, selectedEntity, onSelect }: Props): JSX.Element {
  // category -> (type -> entities), type = cleaned machine name (Smelter, ...)
  const groups = useMemo(() => {
    const cats = new Map<EntityCategory, Map<string, GameEntity[]>>();
    for (const e of entities) {
      let types = cats.get(e.category);
      if (!types) { types = new Map(); cats.set(e.category, types); }
      const type = cleanName(e.name);
      const arr = types.get(type);
      if (arr) arr.push(e);
      else types.set(type, [e]);
    }
    return cats;
  }, [entities]);

  const [openCats, setOpenCats] = useState<Set<EntityCategory>>(new Set());
  const [openTypes, setOpenTypes] = useState<Set<string>>(new Set());

  const toggle = <T,>(set: Set<T>, key: T, setter: (s: Set<T>) => void): void => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        ENTITES
        <span className={styles.count}>{entities.length}</span>
      </div>
      <div className={styles.list}>
        {ORDER.filter(cat => groups.has(cat)).map(cat => {
          const types = groups.get(cat)!;
          const catCount = [...types.values()].reduce((s, a) => s + a.length, 0);
          const catOpen = openCats.has(cat);
          // types sorted by population desc
          const typeEntries = [...types.entries()].sort((a, b) => b[1].length - a[1].length);
          return (
            <div key={cat}>
              <button
                type="button"
                className={styles.group}
                onClick={() => toggle(openCats, cat, setOpenCats)}
              >
                <span className={styles.chevron}>{catOpen ? '▾' : '▸'}</span>
                <span className={styles.dot} style={{ backgroundColor: CAT_COLORS[cat] }} />
                <span className={styles.groupName}>{CAT_LABELS[cat]}</span>
                <span className={styles.count}>{catCount}</span>
              </button>
              {catOpen && (
                <div className={styles.groupItems}>
                  {typeEntries.map(([type, items]) => {
                    const tkey = `${cat}:${type}`;
                    const tOpen = openTypes.has(tkey);
                    // custom-named instances first
                    const sorted = [...items].sort((a, b) =>
                      Number(!!b.customName) - Number(!!a.customName)
                    );
                    return (
                      <div key={tkey}>
                        <button
                          type="button"
                          className={styles.subgroup}
                          onClick={() => toggle(openTypes, tkey, setOpenTypes)}
                        >
                          <span className={styles.chevron}>{tOpen ? '▾' : '▸'}</span>
                          <span className={styles.groupName}>{type}</span>
                          <span className={styles.count}>{items.length}</span>
                        </button>
                        {tOpen && (
                          <div className={styles.groupItems}>
                            {sorted.slice(0, PER_TYPE).map(entity => {
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
                            {items.length > PER_TYPE && (
                              <div className={styles.more}>
                                +{(items.length - PER_TYPE).toLocaleString('fr-FR')}…
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
