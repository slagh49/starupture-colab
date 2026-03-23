import type { GameEntity } from '../../types/save.types';
import { CAT_COLORS } from '../../constants/colors';
import styles from './EntityList.module.css';

interface Props {
  entities: GameEntity[];
  selectedEntity: GameEntity | null;
  onSelect: (entity: GameEntity) => void;
}

export function EntityList({ entities, selectedEntity, onSelect }: Props): JSX.Element {
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        ENTITES
        <span className={styles.count}>{entities.length}</span>
      </div>
      <div className={styles.list}>
        {entities.map(entity => {
          const isSelected = selectedEntity?.id === entity.id;
          const color = CAT_COLORS[entity.category];
          return (
            <button
              key={entity.id}
              type="button"
              className={`${styles.item} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect(entity)}
            >
              <span className={styles.dot} style={{ backgroundColor: color }} />
              <span className={styles.name}>{entity.name}</span>
              {entity.category === 'machine' && entity.status === 'on' && (
                <span className={styles.badgeOn}>ON</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
