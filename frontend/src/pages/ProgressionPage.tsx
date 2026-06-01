import { useState, useEffect } from 'react';
import type { Progression } from '../types/save.types';
import { savesApi } from '../services/api';
import styles from './ProgressionPage.module.css';

interface Props {
  sessionId: string | null;
}

const CORP_META: Record<string, { label: string; logo: string }> = {
  CleverCorporation: { label: 'Clever Robotics', logo: '/corps/clever.webp' },
  GriffithsCorporation: { label: 'Griffith Blue', logo: '/corps/griffith.webp' },
  SelenianCorporation: { label: 'Selenian Corporation', logo: '/corps/selenian.webp' },
  FutureCorporation: { label: 'Future Health Solutions', logo: '/corps/future.webp' },
  MoonCorporation: { label: 'Moon Energy', logo: '/corps/moon.webp' },
  StartingCorporation: { label: 'Training Corporation', logo: '/corps/training.webp' },
};

export function ProgressionPage({ sessionId }: Props): JSX.Element {
  const [data, setData] = useState<Progression | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setData(null);
      return;
    }
    let cancelled = false;
    savesApi
      .progression(sessionId)
      .then(res => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return <div className={styles.empty}>Sélectionnez une session.</div>;
  }
  if (!data || !data.corporations || data.corporations.length === 0) {
    return <div className={styles.empty}>Aucune donnée de progression (ré-uploadez la save).</div>;
  }

  const corps = [...data.corporations].sort((a, b) => b.level - a.level || b.reputation - a.reputation);
  const totalRecipes = data.recipesUnlocked + data.recipesLocked;
  const pct = totalRecipes > 0 ? Math.round((data.recipesUnlocked / totalRecipes) * 100) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <h2 className={styles.title}>CORPORATIONS</h2>
        <div className={styles.grid}>
          {corps.map(c => {
            const meta = CORP_META[c.name] ?? { label: c.name, logo: '' };
            return (
              <div key={c.name} className={styles.card}>
                {meta.logo && <img src={meta.logo} alt={meta.label} className={styles.logo} />}
                <div className={styles.cardBody}>
                  <div className={styles.corpName}>{meta.label}</div>
                  <div className={styles.level}>Niveau {c.level}</div>
                  <div className={styles.rep}>
                    Réputation <b>{c.reputation.toLocaleString('fr-FR')}</b>
                  </div>
                  {(c.researchTier1 > 0 || c.researchTier2 > 0) && (
                    <div className={styles.rp}>
                      RP T1 {c.researchTier1} · T2 {c.researchTier2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.title}>PLANS</h2>
        <div className={styles.plans}>
          <div className={styles.planStat}>
            <span className={styles.planNum}>{data.recipesUnlocked}</span>
            <span className={styles.planLbl}>débloqués</span>
          </div>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.planStat}>
            <span className={styles.planNum}>{data.recipesLocked}</span>
            <span className={styles.planLbl}>verrouillés</span>
          </div>
          <div className={styles.planPct}>{pct}%</div>
        </div>
      </div>
    </div>
  );
}
