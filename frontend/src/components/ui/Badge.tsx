import styles from './Badge.module.css';

interface Props {
  label: string;
  color: string;
}

export function Badge({ label, color }: Props): JSX.Element {
  return (
    <span
      className={styles.badge}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}15`,
      }}
    >
      {label}
    </span>
  );
}
