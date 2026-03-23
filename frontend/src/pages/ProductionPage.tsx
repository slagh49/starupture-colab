import styles from './ProductionPage.module.css';

export function ProductionPage(): JSX.Element {
  return (
    <div className={styles.page}>
      <div className={styles.placeholder}>
        <div className={styles.icon}>[ ]</div>
        <div className={styles.title}>PRODUCTION TABLE</div>
        <div className={styles.subtitle}>
          Sortable, filterable production overview with minimap — coming in Sprint 2
        </div>
      </div>
    </div>
  );
}
