import { useState, useMemo } from 'react';
import type { GameEntity, EntityCategory } from '../../types/save.types';
import { CAT_COLORS, CAT_LABELS } from '../../constants/colors';
import { displayName, cleanRecipe } from '../../utils/format';
import { Badge } from '../ui/Badge';
import styles from './ProductionTable.module.css';

type SortKey = 'name' | 'category' | 'recipe' | 'status' | 'infection' | 'position';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'on' | 'off';

interface Props {
  entities: GameEntity[];
  selectedEntity: GameEntity | null;
  onSelectEntity: (entity: GameEntity | null) => void;
}

const PRODUCTION_CATEGORIES: Set<EntityCategory> = new Set(['machine', 'energy']);

export function ProductionTable({ entities, selectedEntity, onSelectEntity }: Props): JSX.Element {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<EntityCategory | 'all'>('all');

  const productionEntities = useMemo(
    () => entities.filter(e => PRODUCTION_CATEGORIES.has(e.category)),
    [entities]
  );

  const filtered = useMemo(() => {
    let result = productionEntities;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        e =>
          e.name.toLowerCase().includes(lower) ||
          (e.recipe?.toLowerCase().includes(lower) ?? false)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter);
    }

    return result;
  }, [productionEntities, search, statusFilter, categoryFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;

    copy.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'category':
          return dir * a.category.localeCompare(b.category);
        case 'recipe':
          return dir * (a.recipe ?? '').localeCompare(b.recipe ?? '');
        case 'status':
          return dir * a.status.localeCompare(b.status);
        case 'infection':
          return dir * (a.infection - b.infection);
        case 'position':
          return dir * (a.x - b.x || a.y - b.y);
        default:
          return 0;
      }
    });

    return copy;
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key: SortKey): string => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ^' : ' v';
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search name or recipe..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.filter}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All status</option>
          <option value="on">ON</option>
          <option value="off">OFF</option>
        </select>
        <select
          className={styles.filter}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as EntityCategory | 'all')}
        >
          <option value="all">All categories</option>
          <option value="machine">Machines</option>
          <option value="energy">Energy</option>
        </select>
        <span className={styles.count}>{sorted.length} / {productionEntities.length}</span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} onClick={() => handleSort('name')}>
                Name{sortIndicator('name')}
              </th>
              <th className={styles.th} onClick={() => handleSort('category')}>
                Category{sortIndicator('category')}
              </th>
              <th className={styles.th} onClick={() => handleSort('recipe')}>
                Recipe{sortIndicator('recipe')}
              </th>
              <th className={styles.th} onClick={() => handleSort('status')}>
                Status{sortIndicator('status')}
              </th>
              <th className={styles.th} onClick={() => handleSort('infection')}>
                Infection{sortIndicator('infection')}
              </th>
              <th className={styles.th} onClick={() => handleSort('position')}>
                Position{sortIndicator('position')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(entity => {
              const isSelected = selectedEntity?.id === entity.id;
              const rowClass = isSelected
                ? `${styles.tr} ${styles.trSelected}`
                : styles.tr;
              return (
                <tr
                  key={entity.id}
                  className={rowClass}
                  onClick={() => onSelectEntity(isSelected ? null : entity)}
                >
                  <td className={styles.td}>{displayName(entity)}</td>
                  <td className={styles.td}>
                    <Badge
                      label={CAT_LABELS[entity.category]}
                      color={CAT_COLORS[entity.category]}
                    />
                  </td>
                  <td className={styles.td}>{cleanRecipe(entity.recipe) ?? '-'}</td>
                  <td className={styles.td}>
                    <span
                      className={
                        entity.status === 'on'
                          ? styles.statusOn
                          : styles.statusOff
                      }
                    >
                      {entity.status.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {entity.infection > 0 ? (
                      <Badge
                        label={`${entity.infection}%`}
                        color={CAT_COLORS.danger}
                      />
                    ) : (
                      <span className={styles.noInfection}>0</span>
                    )}
                  </td>
                  <td className={styles.tdPosition}>
                    {Math.round(entity.x)}, {Math.round(entity.y)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td className={styles.tdEmpty} colSpan={6}>
                  No matching entities
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
