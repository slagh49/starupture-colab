import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImportDiff, NumericDelta } from '../types/diff.types';
import { savesApi } from '../services/api';
import { formatPlaytime } from '../utils/format';
import styles from './LogPage.module.css';

interface Props {
  sessionId: string | null;
}

// Clés des métriques affichées (libellés via i18n : log.metric.<clé>).
const METRIC_KEYS = [
  'totalEntities',
  'infectedCount',
  'offCount',
  'outputFullCount',
  'missingItemsCount',
  'recipesUnlocked',
  'recipesLocked',
] as const;

function deltaSign(d: number): string {
  return d > 0 ? `+${d}` : String(d);
}

function DeltaRow({ label, delta }: { label: string; delta: NumericDelta }): JSX.Element {
  const positive = delta.delta > 0;
  const negative = delta.delta < 0;
  return (
    <tr>
      <td className={styles.metricLabel}>{label}</td>
      <td className={styles.before}>{delta.before}</td>
      <td className={styles.arrow}>→</td>
      <td className={styles.after}>{delta.after}</td>
      <td className={`${styles.delta} ${positive ? styles.positive : ''} ${negative ? styles.negative : ''}`}>
        {deltaSign(delta.delta)}
      </td>
    </tr>
  );
}

export function LogPage({ sessionId }: Props): JSX.Element {
  const { t } = useTranslation();
  const [diff, setDiff] = useState<ImportDiff | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setDiff(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    savesApi.diff(sessionId)
      .then(res => { if (!cancelled) setDiff(res.data); })
      .catch(() => { if (!cancelled) setDiff(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sessionId]);

  if (!sessionId) {
    return <div className={styles.empty}>{t('log.selectSession')}</div>;
  }
  if (loading) {
    return <div className={styles.empty}>{t('log.loading')}</div>;
  }
  if (!diff || Object.keys(diff).length === 0) {
    return (
      <div className={styles.empty}>
        {t('log.noChanges')}
      </div>
    );
  }

  const metrics = METRIC_KEYS
    .filter(key => diff[key as keyof ImportDiff])
    .map(key => ({ key, label: t('log.metric.' + key), delta: diff[key as keyof ImportDiff] as NumericDelta }));

  const catChanges = diff.byCategory
    ? Object.entries(diff.byCategory).map(([cat, delta]) => ({
        cat,
        label: t('category.' + cat),
        delta,
      }))
    : [];

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{t('log.title')}</h1>
      <p className={styles.subtitle}>{t('log.subtitle')}</p>

      {diff.playtime && (
        <div className={styles.section}>
          <h2 className={styles.title}>{t('log.playtime')}</h2>
          <div className={styles.playtimeRow}>
            <span>{formatPlaytime(diff.playtime.before)}</span>
            <span className={styles.arrow}>→</span>
            <span>{formatPlaytime(diff.playtime.after)}</span>
            <span className={styles.positive}>
              +{formatPlaytime(diff.playtime.delta)}
            </span>
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.title}>{t('log.metrics')}</h2>
          <table className={styles.table}>
            <tbody>
              {metrics.map(m => (
                <DeltaRow key={m.key} label={m.label} delta={m.delta} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {catChanges.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.title}>{t('log.byCategory')}</h2>
          <table className={styles.table}>
            <tbody>
              {catChanges.map(c => (
                <DeltaRow key={c.cat} label={c.label} delta={c.delta} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {diff.newRecipesUnlocked && diff.newRecipesUnlocked.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.title}>{t('log.newRecipesUnlocked')}</h2>
          <div className={styles.badgeList}>
            {diff.newRecipesUnlocked.map(name => (
              <span key={name} className={styles.badgeGreen}>{name}</span>
            ))}
          </div>
        </div>
      )}

      {diff.newEntityTypes && diff.newEntityTypes.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.title}>{t('log.newEntityTypes')}</h2>
          <div className={styles.badgeList}>
            {diff.newEntityTypes.map(name => (
              <span key={name} className={styles.badgeCyan}>{name}</span>
            ))}
          </div>
        </div>
      )}

      {diff.removedEntityTypes && diff.removedEntityTypes.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.title}>{t('log.removedEntityTypes')}</h2>
          <div className={styles.badgeList}>
            {diff.removedEntityTypes.map(name => (
              <span key={name} className={styles.badgeRed}>{name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
