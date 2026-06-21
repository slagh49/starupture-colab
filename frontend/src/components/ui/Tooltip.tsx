import { useTranslation } from 'react-i18next';
import type { GameEntity } from '../../types/save.types';
import { CAT_COLORS } from '../../constants/colors';
import styles from './Tooltip.module.css';

interface Props {
  entity: GameEntity;
  screenX: number;
  screenY: number;
}

export function Tooltip({ entity, screenX, screenY }: Props): JSX.Element {
  const { t } = useTranslation();
  const color = CAT_COLORS[entity.category];
  const label = t('category.' + entity.category);

  return (
    <div
      className={styles.tooltip}
      style={{
        left: screenX + 14,
        top: screenY - 10,
      }}
    >
      <div className={styles.name} style={{ color }}>
        {entity.name}
      </div>
      <div className={styles.category}>{label}</div>
      {entity.recipe && (
        <div className={styles.recipe}>{entity.recipe}</div>
      )}
      {entity.infection > 0 && (
        <div className={styles.infection} style={{ color: CAT_COLORS.danger }}>
          {t('tooltip.infection', { count: entity.infection })}
        </div>
      )}
      {entity.status === 'off' && (
        <div className={styles.statusOff}>OFF</div>
      )}
    </div>
  );
}
