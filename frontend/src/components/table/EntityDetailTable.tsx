import type { GameEntity, DroneLink } from '../../types/save.types';
import { CAT_COLORS, CAT_LABELS } from '../../constants/colors';
import styles from './EntityDetailTable.module.css';

interface Props {
  entity: GameEntity | null;
  links: DroneLink[];
}

export function EntityDetailTable({ entity, links }: Props): JSX.Element {
  if (!entity) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>DETAIL</div>
        <div className={styles.empty}>Select an entity to view details</div>
      </div>
    );
  }

  const color = CAT_COLORS[entity.category];
  const relatedLinks = links.filter(
    l => l.fromEntityId === entity.id || l.toEntityId === entity.id
  );
  const totalDrones = relatedLinks.reduce((sum, l) => sum + l.droneCount, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>DETAIL</div>
      <div className={styles.body}>
        <div className={styles.entityName} style={{ color }}>
          {entity.name}
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Category</span>
          <span className={styles.value} style={{ color }}>
            {CAT_LABELS[entity.category]}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Position</span>
          <span className={styles.valueMono}>
            X:{Math.round(entity.x)} Y:{Math.round(entity.y)} Z:{Math.round(entity.z)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Recipe</span>
          <span className={styles.value}>{entity.recipe ?? 'None'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Status</span>
          <span
            className={styles.value}
            style={{ color: entity.status === 'on' ? CAT_COLORS.machine : '#777777' }}
          >
            {entity.status.toUpperCase()}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Infection</span>
          <span
            className={styles.value}
            style={{ color: entity.infection > 0 ? CAT_COLORS.danger : undefined }}
          >
            {entity.infection}%
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Drones</span>
          <span className={styles.value}>
            {totalDrones} ({relatedLinks.length} links)
          </span>
        </div>
        {relatedLinks.length > 0 && (
          <div className={styles.linksSection}>
            <div className={styles.linksTitle}>Drone links</div>
            {relatedLinks.map(link => (
              <div key={link.id} className={styles.linkRow}>
                <span className={styles.linkItem}>{link.item}</span>
                <span className={styles.linkCount}>x{link.droneCount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
