import { useState, useEffect } from 'react';
import type { ImportDiff, NumericDelta } from '../types/diff.types';
import { savesApi } from '../services/api';
import { formatPlaytime } from '../utils/format';
import styles from './LogPage.module.css';

interface Props {
  sessionId: string | null;
}

const METRIC_LABELS: Record<string, string> = {
  totalEntities: 'Entités totales',
  infectedCount: 'Infectées',
  offCount: 'Machines éteintes',
  outputFullCount: 'Sorties pleines',
  missingItemsCount: 'Intrants manquants',
  recipesUnlocked: 'Recettes débloquées',
  recipesLocked: 'Recettes verrouillées',
};

const CAT_LABELS: Record<string, string> = {
  basecore: 'Base Core',
  machine: 'Machines',
  energy: 'Énergie',
  infra: 'Infrastructure',
  antenna: 'Antennes',
  danger: 'Danger',
  loot: 'Lootables',
};

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
    return <div className={styles.empty}>Sélectionnez une session.</div>;
  }
  if (loading) {
    return <div className={styles.empty}>Chargement…</div>;
  }
  if (!diff || Object.keys(diff).length === 0) {
    return (
      <div className={styles.empty}>
        Aucun changement détecté (premier import, ou pas de différence avec le précédent).
      </div>
    );
  }

  const metrics = Object.entries(METRIC_LABELS)
    .filter(([key]) => diff[key as keyof ImportDiff])
    .map(([key, label]) => ({ key, label, delta: diff[key as keyof ImportDiff] as NumericDelta }));

  const catChanges = diff.byCategory
    ? Object.entries(diff.byCategory).map(([cat, delta]) => ({
        cat,
        label: CAT_LABELS[cat] ?? cat,
        delta,
      }))
    : [];

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>JOURNAL DE BORD</h1>
      <p className={styles.subtitle}>Changements détectés par rapport à l'import précédent</p>

      {diff.playtime && (
        <div className={styles.section}>
          <h2 className={styles.title}>TEMPS DE JEU</h2>
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
          <h2 className={styles.title}>MÉTRIQUES</h2>
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
          <h2 className={styles.title}>PAR CATÉGORIE</h2>
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
          <h2 className={styles.title}>NOUVELLES RECETTES DÉBLOQUÉES</h2>
          <div className={styles.badgeList}>
            {diff.newRecipesUnlocked.map(name => (
              <span key={name} className={styles.badgeGreen}>{name}</span>
            ))}
          </div>
        </div>
      )}

      {diff.newEntityTypes && diff.newEntityTypes.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.title}>NOUVEAUX TYPES D'ENTITÉS</h2>
          <div className={styles.badgeList}>
            {diff.newEntityTypes.map(name => (
              <span key={name} className={styles.badgeCyan}>{name}</span>
            ))}
          </div>
        </div>
      )}

      {diff.removedEntityTypes && diff.removedEntityTypes.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.title}>TYPES D'ENTITÉS DISPARUS</h2>
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
