import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Progression, LockedRecipe } from '../types/save.types';
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
  const { t } = useTranslation();
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
    return <div className={styles.empty}>{t('progression.selectSession')}</div>;
  }
  if (!data || !data.corporations || data.corporations.length === 0) {
    return <div className={styles.empty}>{t('progression.noData')}</div>;
  }

  const corps = [...data.corporations].sort((a, b) => b.level - a.level || b.reputation - a.reputation);
  const totalRecipes = data.recipesUnlocked + data.recipesLocked;
  const pct = totalRecipes > 0 ? Math.round((data.recipesUnlocked / totalRecipes) * 100) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <h2 className={styles.title}>{t('progression.corporations')}</h2>
        <div className={styles.grid}>
          {corps.map(c => {
            const meta = CORP_META[c.name] ?? { label: c.name, logo: '' };
            return (
              <div key={c.name} className={styles.card}>
                {meta.logo && <img src={meta.logo} alt={meta.label} className={styles.logo} />}
                <div className={styles.cardBody}>
                  <div className={styles.corpName}>{meta.label}</div>
                  <div className={styles.level}>{t('progression.level', { level: c.level })}</div>
                  <div className={styles.rep}>
                    {t('progression.reputation')} <b>{c.reputation.toLocaleString('fr-FR')}</b>
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
        <h2 className={styles.title}>{t('progression.plans')}</h2>
        <div className={styles.plans}>
          <div className={styles.planStat}>
            <span className={styles.planNum}>{data.recipesUnlocked}</span>
            <span className={styles.planLbl}>{t('progression.unlocked')}</span>
          </div>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.planStat}>
            <span className={styles.planNum}>{data.recipesLocked}</span>
            <span className={styles.planLbl}>{t('progression.locked')}</span>
          </div>
          <div className={styles.planPct}>{pct}%</div>
        </div>
      </div>

      {data.unlockedRecipeNames && data.unlockedRecipeNames.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.title}>{t('progression.unlockedRecipes', { count: data.unlockedRecipeNames.length })}</h2>
          <div className={styles.recipeList}>
            {data.unlockedRecipeNames.map(name => (
              <span key={name} className={styles.recipeBadge}>{name}</span>
            ))}
          </div>
        </div>
      )}

      {data.lockedRecipeDetails && data.lockedRecipeDetails.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.title}>{t('progression.lockedRecipes', { count: data.lockedRecipeDetails.length })}</h2>
          <div className={styles.lockedGrid}>
            {data.lockedRecipeDetails.map((r: LockedRecipe) => {
              const hasProgress = r.items.some(it => it.count > 0);
              return (
                <div key={r.name} className={`${styles.lockedCard} ${hasProgress ? styles.started : ''}`}>
                  <div className={styles.lockedName}>{r.name}</div>
                  <div className={styles.lockedItems}>
                    {r.items.map(it => (
                      <span key={it.item} className={`${styles.lockedItem} ${it.count > 0 ? styles.collected : ''}`}>
                        {it.item}: <b>{it.count.toLocaleString('fr-FR')}</b>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
