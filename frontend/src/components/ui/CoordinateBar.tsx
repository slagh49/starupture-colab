import styles from './CoordinateBar.module.css';

interface Props {
  worldX: number;
  worldY: number;
}

export function CoordinateBar({ worldX, worldY }: Props): JSX.Element {
  return (
    <div className={styles.bar}>
      <span className={styles.coord}>
        X: <span className={styles.value}>{Math.round(worldX)}</span>
      </span>
      <span className={styles.coord}>
        Y: <span className={styles.value}>{Math.round(worldY)}</span>
      </span>
    </div>
  );
}
