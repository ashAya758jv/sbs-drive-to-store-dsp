# État d'avancement — Semaine 3

**Module livré : Création de campagne (assistant multi-étapes en 4 étapes)**

> Ce document résume le travail réalisé en Semaine 3, en complément de la
> fondation validée en Semaine 2 (frontend React, backend FastAPI, migration
> PostgreSQL initiale, documentation du schéma).

## 1. Objectif de la semaine

Développer le parcours complet de **création de campagne** demandé par la
roadmap : un formulaire guidé en 4 étapes, connecté à de nouveaux endpoints
backend, avec sauvegarde de la campagne au statut `draft`.

## 2. Ce qui a été réalisé

### Frontend (React / Vite)

- **Assistant en 4 étapes** à la route `/campagnes/nouvelle` :
  1. **Informations générales** — nom, annonceur, objectif, dates, budget total
     (obligatoire) et budget quotidien (**optionnel**).
  2. **Ciblage technique** — appareils (mobile, desktop, tablette), systèmes
     d'exploitation (Android, iOS, Windows, macOS), plages horaires.
  3. **Formats publicitaires** — bannière, pavé, interstitiel (avec description
     de chaque format ; au moins un format obligatoire).
  4. **Catégories d'applications** — sélection par catégorie, toggle
     « Exclure les jeux » **activé par défaut**, **compteur d'impressions
     estimées** en direct, et **résumé final** de la campagne.
- **Stepper horizontal** indiquant l'étape courante et les étapes validées.
- **Boutons** : Précédent, Suivant, Enregistrer le brouillon, Créer la campagne.
- **Validation** claire des champs obligatoires à chaque étape, avec messages
  d'erreur visibles (bordures rouges + texte explicite). Contrôles de
  cohérence : date de fin ≥ date de début. Le **budget quotidien est optionnel** ;
  s'il est renseigné, il doit être un nombre positif ou nul et ne pas dépasser le
  budget total. S'il est laissé vide, l'API l'enregistre à 0.
- **Page « Campagnes »** (`/campagnes`) transformée en liste avec un bouton
  **« Créer une campagne »** et l'affichage des brouillons créés.
- **Couche API frontend** (`src/lib/api.js`, `src/data/campaignApi.js`) avec
  **repli automatique** : si le backend n'est pas lancé, les options utilisent
  un catalogue local et les brouillons sont enregistrés dans `localStorage`, de
  sorte que le parcours reste testable de bout en bout.
- **Composants UI réutilisables** ajoutés dans le respect du design existant :
  `Input`, `Field`, `Checkbox`, `Toggle` (mêmes couleurs, arrondis et espacements
  que les composants de la Semaine 2).

> Le design global (sidebar, header, cartes, boutons, palette violette) n'a pas
> été modifié. Le dashboard et le login n'ont pas été touchés.

### Backend (FastAPI)

- Nouveaux endpoints (voir §3), sans toucher aux endpoints existants.
- **Persistance des brouillons via SQLAlchemy** (`draft_store.py`) :
  - utilise `DATABASE_URL` (PostgreSQL) en priorité ;
  - **repli développement** automatique sur une base **SQLite locale**
    (`backend/.local/`, non versionnée) si PostgreSQL n'est pas disponible, sans
    casser la compatibilité PostgreSQL.
- Nouveau modèle ORM `CampaignDraft` et schémas Pydantic
  (`DraftCreate`, `DraftRead`, options) avec validation côté serveur.

### Base de données

- Nouvelle migration **`database/migrations/002_campaign_drafts.sql`** :
  table `campaign_drafts` (colonnes principales + colonne `JSONB payload` pour
  les sélections de l'assistant), clé étrangère vers `advertisers`, contraintes,
  trigger `updated_at` et index. Compatible PostgreSQL, cohérente avec le modèle
  SQLAlchemy.

## 3. Endpoints ajoutés

| Méthode | URL                                   | Description                                        |
| ------- | ------------------------------------- | -------------------------------------------------- |
| GET     | `/api/campaign-creation/options`      | Catalogue d'options de l'assistant (objectifs, annonceurs, devices, OS, plages horaires, formats, catégories). |
| POST    | `/api/campaigns/drafts`               | Enregistre le formulaire complet en **brouillon** (statut `draft`). |
| GET     | `/api/campaigns/drafts`               | Liste des brouillons.                              |
| GET     | `/api/campaigns/drafts/{draft_id}`    | Détail d'un brouillon (404 si introuvable).        |

Les endpoints existants restent inchangés : `/api/health`, `/api/users`,
`/api/advertisers`, `/api/stores`, `/api/campaigns`, `/api/statistics/dashboard`.

### Exemple de corps pour `POST /api/campaigns/drafts`

```json
{
  "name": "Marjane Été 2026",
  "advertiser_id": 1,
  "objective": "drive_to_store",
  "start_date": "2026-07-01",
  "end_date": "2026-07-31",
  "total_budget": 50000,
  "daily_budget": 1600,
  "devices": ["mobile", "tablet"],
  "operating_systems": ["android", "ios"],
  "time_ranges": ["morning", "evening"],
  "formats": ["banner", "interstitial"],
  "app_categories": ["news", "shopping"],
  "exclude_games": true,
  "estimated_impressions": 1250000
}
```

## 4. Commandes de vérification

### Frontend

```bash
cd frontend
npm install        # si nécessaire
npm run build      # build de production (doit passer)
npm run lint       # ESLint (aucune erreur)
npm run dev        # http://localhost:5173 → Campagnes → « Créer une campagne »
```

### Backend

```bash
cd backend
.\.venv\Scripts\Activate.ps1        # Windows (ou: source .venv/bin/activate)
pip install -r requirements.txt      # si nécessaire
uvicorn app.main:app --reload        # http://127.0.0.1:8000/docs
```

Le parcours fonctionne **sans PostgreSQL** (repli SQLite pour le POST, repli
`localStorage` côté frontend si le backend est éteint).

### Base de données (optionnel, si PostgreSQL est configuré)

```bash
psql "postgresql://sbs:sbs@localhost:5432/sbs_dsp" -f database/migrations/001_initial_schema.sql
psql "postgresql://sbs:sbs@localhost:5432/sbs_dsp" -f database/migrations/002_campaign_drafts.sql
```

## 5. Limites actuelles

- Le **compteur d'impressions estimées** est une estimation indicative
  (heuristique côté client basée sur le budget et la largeur du ciblage), pas
  une prévision d'inventaire réelle.
- Les **lectures** de campagnes/annonceurs restent sur données mockées ; seuls
  les **brouillons** sont réellement persistés.
- Le repli **SQLite** est réservé au développement local ; la cible reste
  PostgreSQL via `DATABASE_URL`.
- Pas encore de **modification / suppression** d'un brouillon, ni de promotion
  d'un brouillon en campagne active.
- Pas de gestion fine des **rôles** au niveau de l'API (l'accès est déjà filtré
  côté frontend : seuls Admin et Media buyer voient le module Campagnes).

## 6. Prochaines étapes

1. Permettre l'**édition** d'un brouillon et sa **promotion** en campagne
   (`status` → `active`) dans la table `campaigns`.
2. Brancher réellement **PostgreSQL** et remplacer les lectures mockées par des
   requêtes SQLAlchemy.
3. Ajouter l'**authentification / autorisation** côté API (rôles).
4. Relier la création de campagne au module **Sélection des magasins** et au
   module **Créations / DCO** (visuels par format).
5. Ajouter des **tests automatisés** (backend : pytest ; frontend : tests de
   composants) pour le parcours de création.
