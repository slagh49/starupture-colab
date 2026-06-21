# Avancement projet — StarRupture Base Scanner

> Tenu à jour par ALEX · Dernière mise à jour : Juin 2026

---

## Sprint en cours : S1 — Fondations

| ID | Story | Agent | Points | Statut |
|---|---|---|---|---|
| SR-001 | Upload `.sav` + liste sessions | MORGAN | 5 | DONE |
| SR-002 | Parser `.sav` → base de données | MORGAN | 8 | DONE |
| SR-003 | Carte interactive + terrain procédural | RILEY | 8 | DONE |
| SR-004 | Zoom/pan + clic entité + détail | RILEY | 5 | DONE |

**Total S1 : 26 pts · Complétés : 26 · Restants : 0**

---

## Sprint en cours : S2 — Visualisation avancée

| ID | Story | Agent | Points | Statut |
|---|---|---|---|---|
| SR-005 | Flux drones animés | RILEY | 5 | DONE |
| SR-006 | Rails et splines sur carte | RILEY | 3 | DONE |
| SR-007 | Tableau de production | RILEY | 8 | DONE |
| SR-008 | Minimap contextuelle | RILEY | 5 | DONE |
| SR-009 | Alertes visuelles infection/OFF | RILEY | 3 | DONE |

**Total S2 : 24 pts · Complétés : 24 · Restants : 0**

---

## Sprint 3 : S3 — CI/CD et finalisation

| ID | Story | Agent | Points | Statut |
|---|---|---|---|---|
| SR-010 | Filtres par catégorie | RILEY | 3 | DONE |
| SR-011 | Pipeline CI/CD | ALEX | 5 | DONE |
| SR-012 | Déploiement prod | ALEX | 3 | DONE |

**Total S3 : 11 pts · Complétés : 11 · Restants : 0**

> **Note SR-012** — la story initiale prévoyait un déploiement prod « avec approval manuel ».
> Choix produit retenu : **livraison directe en prod** sur `push main` (pas d'approval).
> Le flux dev/staging a été abandonné : le job `deploy-staging` (branche `develop`) et
> `docker-compose.staging.yml` ont été supprimés de la CI. Pipeline désormais 100 % `main → prod`.

---

## Blocages actifs

_Aucun blocage pour l'instant._

---

## Résumé global

| Sprint | Points | Statut |
|---|---|---|
| S1 | 26 | ✅ Terminé |
| S2 | 24 | ✅ Terminé |
| S3 | 11 | ✅ Terminé |
| **Total** | **61** | ✅ Terminé |
