import { useTranslation } from 'react-i18next';
import type { GameEntity, DroneLink } from '../../types/save.types';
import { CAT_COLORS } from '../../constants/colors';
import styles from './EntityDetailTable.module.css';

interface Props {
  entity: GameEntity | null;
  links: DroneLink[];
}

export function EntityDetailTable({ entity, links }: Props): JSX.Element {
  const { t } = useTranslation();
  if (!entity) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>{t('entityDetailTable.header')}</div>
        <div className={styles.empty}>{t('entityDetailTable.empty')}</div>
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
      <div className={styles.header}>{t('entityDetailTable.header')}</div>
      <div className={styles.body}>
        <div className={styles.entityName} style={{ color }}>
          {entity.name}
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{t('entityDetailTable.category')}</span>
          <span className={styles.value} style={{ color }}>
            {t('category.' + entity.category)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{t('entityDetailTable.position')}</span>
          <span className={styles.valueMono}>
            X:{Math.round(entity.x)} Y:{Math.round(entity.y)} Z:{Math.round(entity.z)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{t('entityDetailTable.recipe')}</span>
          <span className={styles.value}>{entity.recipe ?? t('entityDetailTable.recipeNone')}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{t('entityDetailTable.status')}</span>
          <span
            className={styles.value}
            style={{ color: entity.status === 'on' ? CAT_COLORS.machine : '#777777' }}
          >
            {entity.status.toUpperCase()}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{t('entityDetailTable.infection')}</span>
          <span
            className={styles.value}
            style={{ color: entity.infection > 0 ? CAT_COLORS.danger : undefined }}
          >
            {entity.infection}%
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{t('entityDetailTable.drones')}</span>
          <span className={styles.value}>
            {t('entityDetailTable.dronesValue', { count: totalDrones, links: relatedLinks.length })}
          </span>
        </div>
        {relatedLinks.length > 0 && (
          <div className={styles.linksSection}>
            <div className={styles.linksTitle}>{t('entityDetailTable.droneLinks')}</div>
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
