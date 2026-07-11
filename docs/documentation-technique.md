# Documentation technique — SBS Data Factory · Drive-to-Store DSP

> Document de référence technique pour l'encadrante et toute personne
> reprenant le projet. Il décrit l'état réel du code à la fin de la
> **Semaine 6** (branche `docs/week6-technical-documentation`) : architecture,
> installation, routes, API, modèle de données et limites connues.
>
> Ce document **complète** (sans les remplacer) :
> - [`README.md`](../README.md) — présentation générale du projet ;
> - [`backend/README.md`](../backend/README.md) — guide de démarrage rapide du backend ;
> - [`docs/schema-base-de-donnees.md`](schema-base-de-donnees.md) — schéma PostgreSQL cible détaillé ;
> - [`docs/etat-avancement-semaine-3.md`](etat-avancement-semaine-3.md) à
>   [`etat-avancement-semaine-6.md`](etat-avancement-semaine-6.md) — journal
>   d'avancement détaillé, semaine par semaine.

## Sommaire

1. [Architecture générale](#1-architecture-générale)
2. [Structure des dossiers](#2-structure-des-dossiers)
3. [Installation locale](#3-installation-locale)
4. [Lancer le backend](#4-lancer-le-backend)
5. [Lancer le frontend](#5-lancer-le-frontend)
6. [Configuration / variables d'environnement](#6-configuration--variables-denvironnement)
7. [Routes frontend](#7-routes-frontend)
8. [Endpoints API backend](#8-endpoints-api-backend)
9. [Schéma logique des entités](#9-schéma-logique-des-entités)
10. [Guide de test fonctionnel rapide](#10-guide-de-test-fonctionnel-rapide)
11. [Limites actuelles](#11-limites-actuelles)
12. [Déploiement — pistes conceptuelles](#12-déploiement--pistes-conceptuelles)

---

## 1. Architecture générale

L'application est une **plateforme web fullstack** composée de deux
applications indépendantes qui communiquent en HTTP/JSON :

```
┌─────────────────────────┐        HTTP / JSON (fetch)        ┌──────────────────────────┐
│   Frontend — React/Vite  │ ────────────────────────────────▶ │   Backend — FastAPI       │
│   http://localhost:5173  │ ◀──────────────────────────────── │   http://127.0.0.1:8000   │
│                          │        CORS autorisé (dev)         │                          │
└─────────────────────────┘                                    └──────────────────────────┘
                                                                          │
                                                                          │ (non branché
                                                                          │  aujourd'hui)
                                                                          ▼
                                                                 ┌──────────────────────────┐
                                                                 │  PostgreSQL (cible)       │
                                                                 │  modèles SQLAlchemy prêts │
                                                                 └──────────────────────────┘
```

- **Frontend** : React 19 + Vite, React Router DOM pour le routage, Tailwind
  CSS v4 pour le style, Recharts pour les graphiques, Leaflet + OpenStreetMap
  pour les cartes. Authentification **simulée** (rôle choisi au login,
  persistée dans `localStorage`, aucun jeton réel envoyé au serveur).
- **Backend** : FastAPI + Pydantic v2, documentation Swagger générée
  automatiquement. Sert aujourd'hui des **données en mémoire**
  (`app/services/mock_data.py`), tout en étant déjà structuré (modèles
  SQLAlchemy, `DATABASE_URL`) pour basculer vers PostgreSQL sans réécrire les
  routes.
- **Base de données** : modèles SQLAlchemy et migrations SQL versionnées
  existent (`backend/app/models/`, `database/migrations/`), mais **aucune
  base PostgreSQL n'est connectée au démarrage** — l'engine est créé de façon
  paresseuse (voir [§11. Limites actuelles](#11-limites-actuelles)). Seuls les
  **brouillons de campagne** sont réellement persistés (PostgreSQL si
  disponible, sinon un fichier SQLite local de secours).
- **Communication** : le frontend appelle l'API via un petit client `fetch`
  centralisé (`frontend/src/lib/api.js`), avec une base URL configurable
  (`VITE_API_URL`, par défaut `http://localhost:8000/api`). Plusieurs écrans
  (assistant de création de campagne notamment) savent fonctionner en mode
  dégradé si l'API est injoignable (repli sur des données locales / `localStorage`).

## 2. Structure des dossiers

### 2.1 Frontend (`frontend/src/`)

```
frontend/src/
├── auth/
│   └── AuthContext.jsx        # Session simulée (rôle, localStorage), hook useAuth()
├── routes/
│   └── AppRouter.jsx          # Déclaration des routes + gardes (RequireAuth, RequireRole)
├── components/
│   ├── layout/                # AppLayout, Sidebar, Header, Breadcrumb, PageHeader
│   ├── ui/                    # Composants génériques : Button, Card, Badge, Input,
│   │                          #   Select, Field, Modal, Tabs, Toggle, Checkbox
│   ├── charts/                # Graphiques Recharts (Dashboard, Reporting)
│   ├── campaigns/              # Étapes de l'assistant de création de campagne
│   ├── stores/                 # Import/sélection magasins, carte Leaflet, StoreUrlText
│   ├── reporting/               # Carte des zones de diffusion, tableau par magasin
│   ├── account/                 # Onglets Annonceurs / Utilisateurs / Paramètres
│   └── common/                  # ModulePreview, PlaceholderPage
├── pages/                      # Une page par route (Login, Dashboard, Campaigns,
│                                #   CampaignCreate, StoreSelection, DCO, Reporting,
│                                #   AccountManagement)
├── data/                       # Couche d'accès aux données par module
│   │                          #   (mockData.js, campaignApi.js, storesApi.js,
│   │                          #    dcoApi.js, reportingData.js, accountApi.js)
├── lib/                        # utilitaires transverses (api.js, cn.js)
├── styles/                     # theme.js (tokens JS partagés, ex. couleurs de charts)
├── App.jsx, main.jsx           # Point d'entrée React
└── index.css                   # Thème Tailwind (couleurs, polices)
```

**Convention** : chaque module métier (campagnes, magasins, DCO, reporting,
compte) a son propre fichier dans `data/` qui encapsule les appels API — les
pages/composants ne font jamais de `fetch` directement.

### 2.2 Backend (`backend/app/`)

```
backend/app/
├── main.py                 # Application FastAPI (CORS, montage des routes, /docs)
├── database.py             # Engine/session SQLAlchemy (création paresseuse, PostgreSQL)
├── core/
│   ├── config.py           # Paramètres (.env) via pydantic-settings
│   └── enums.py            # Énumérations partagées (rôles, statuts, objectifs, formats)
├── models/                 # Modèles SQLAlchemy (schéma PostgreSQL cible)
│   │                       #   User, Advertiser, Store, Campaign, CampaignDraft,
│   │                       #   Creative, Statistic
├── schemas/                 # Schémas Pydantic (validation des requêtes, forme des réponses)
├── routes/                  # Un fichier de routeur par ressource (voir §8)
└── services/                 # Logique métier / accès aux données
    ├── mock_data.py          # Jeu de données en mémoire (source unique de vérité)
    ├── draft_store.py         # Persistance réelle des brouillons (PostgreSQL ou SQLite)
    └── *_service.py            # Un service par ressource (advertisers, users, stores…)
```

**Convention** : les routes ne contiennent aucune logique métier — elles
appellent un `*_service.py`, catchent ses exceptions dédiées
(`XNotFoundError`, `DuplicateEmailError`…) et les traduisent en
`HTTPException` (404, 409, 422…). Les schémas Pydantic distinguent toujours
un schéma `*Read` (réponse) d'un ou plusieurs schémas `*Create` / `*Update`
(requête), pour appliquer des règles de validation différentes en lecture et
en écriture.

## 3. Installation locale

Prérequis :

| Outil       | Version conseillée | Vérifier avec        |
| ----------- | ------------------- | --------------------- |
| Node.js     | 18+                  | `node --version`      |
| npm         | fourni avec Node.js  | `npm --version`       |
| Python      | 3.10+ (3.11/3.12 ok) | `python --version`    |
| pip         | fourni avec Python   | `pip --version`       |

```bash
git clone <url-du-dépôt>
cd sbs-drive-to-store-dsp
```

Le projet contient deux applications indépendantes (`frontend/`, `backend/`),
chacune avec ses propres dépendances — voir §4 et §5 ci-dessous. Aucune base
de données n'est requise pour lancer l'application en local : tout fonctionne
sur données mockées (voir [§11](#11-limites-actuelles)).

## 4. Lancer le backend

```bash
cd backend

# 1. Créer et activer un environnement virtuel
python -m venv .venv
# Windows (PowerShell) :
.\.venv\Scripts\Activate.ps1
# macOS / Linux :
source .venv/bin/activate

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. (optionnel) copier la config d'exemple
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux

# 4. Lancer le serveur de développement
uvicorn app.main:app --reload
```

Le serveur démarre sur **http://127.0.0.1:8000**. Aucune configuration n'est
obligatoire : toutes les valeurs de `app/core/config.py` ont une valeur par
défaut adaptée au développement local (voir §6).

- **Swagger UI** (documentation interactive, testable) : http://127.0.0.1:8000/docs
- **ReDoc** : http://127.0.0.1:8000/redoc
- **Schéma OpenAPI brut** : http://127.0.0.1:8000/api/openapi.json

Vérification rapide :

```bash
curl http://127.0.0.1:8000/api/health
# {"status":"ok","service":"SBS Data Factory — Drive-to-Store DSP API","version":"0.1.0"}
```

## 5. Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

Le serveur Vite démarre sur **http://localhost:5173** et se connecte au
backend sur `http://localhost:8000/api` par défaut (voir §6 pour changer
cette URL).

Autres commandes utiles :

```bash
npm run build     # build de production → frontend/dist/
npm run preview   # prévisualiser le build de production
npm run lint      # vérifier le code avec ESLint
```

### Connexion (démo)

L'authentification est **simulée** : n'importe quel couple email / mot de
passe est accepté. Le **rôle** choisi sur l'écran de connexion détermine
l'accès :

| Rôle          | Accès                                                                |
| ------------- | ---------------------------------------------------------------------- |
| **Admin**       | Tous les modules, y compris édition dans Gestion du compte           |
| **Media buyer** | Tout sauf Gestion du compte en édition (lecture seule sur `/compte`) |
| **Lecteur**     | Dashboard, Magasins, Reporting, Gestion du compte — toujours en lecture seule ; pas d'accès à Campagnes ni DCO |

## 6. Configuration / variables d'environnement

### Backend (`backend/.env`, optionnel — copié depuis `.env.example`)

| Variable                | Valeur par défaut                                                  | Rôle                                            |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------- |
| `PROJECT_NAME`            | `SBS Data Factory — Drive-to-Store DSP API`                          | Nom affiché dans Swagger / la réponse `/`          |
| `API_PREFIX`              | `/api`                                                                | Préfixe de toutes les routes (`/api/health`, etc.) |
| `DATABASE_URL`            | `postgresql+psycopg2://sbs:sbs@localhost:5432/sbs_dsp`                | Connexion PostgreSQL (non requise aujourd'hui)     |
| `BACKEND_CORS_ORIGINS`    | `http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173` | Origines autorisées à appeler l'API depuis le navigateur |

Aucune de ces variables n'est obligatoire pour un lancement local standard —
elles ont toutes une valeur par défaut cohérente dans
`backend/app/core/config.py`.

### Frontend

| Variable         | Valeur par défaut               | Rôle                                                |
| ----------------- | --------------------------------- | ------------------------------------------------------ |
| `VITE_API_URL`     | `http://localhost:8000/api`       | URL de base de l'API backend, utilisée par `lib/api.js` |

Pour la surcharger : créer un fichier `frontend/.env.local` avec
`VITE_API_URL=http://mon-backend:8000/api`, puis relancer `npm run dev`.

## 7. Routes frontend

Toutes les routes protégées passent par `RequireAuth` (redirige vers
`/login` si aucune session) ; certaines ajoutent en plus `RequireRole`
(redirige vers `/dashboard` si le rôle n'est pas autorisé). Défini dans
`frontend/src/routes/AppRouter.jsx`.

| Route                  | Page                        | Rôles autorisés                          | Description                                                          |
| ------------------------ | ----------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `/login`                  | `Login.jsx`                    | public                                       | Connexion simulée (email + mot de passe + choix du rôle)               |
| `/dashboard`               | `Dashboard.jsx`                 | tous les rôles authentifiés                  | Vue d'ensemble : KPI, graphique de performance, campagnes récentes     |
| `/campagnes`               | `Campaigns.jsx`                  | Admin, Media buyer                           | Liste des campagnes + brouillons en attente                            |
| `/campagnes/nouvelle`      | `CampaignCreate.jsx`             | Admin, Media buyer                           | Assistant de création en 5 étapes (voir détail ci-dessous)              |
| `/magasins`                | `StoreSelection.jsx`             | tous les rôles authentifiés                  | Import de la base magasins, sélection, geofencing, carte                |
| `/dco`                     | `DCO.jsx`                        | Admin, Media buyer                           | Upload de visuels, génération de variantes, landing pages simulées      |
| `/reporting`               | `Reporting.jsx`                   | tous les rôles authentifiés                  | KPI, graphiques, carte des zones de diffusion, tableau, export CSV      |
| `/compte`                  | `AccountManagement.jsx`           | tous les rôles authentifiés (édition = Admin uniquement) | Annonceurs, Utilisateurs, Paramètres du compte                |
| `/` et routes inconnues    | —                                 | —                                             | Redirection automatique vers `/dashboard`                              |

**Assistant de création de campagne (`/campagnes/nouvelle`)**, 5 étapes :
1. Informations générales (nom, annonceur, objectif, dates, budgets)
2. Ciblage technique (appareils, systèmes d'exploitation, plages horaires)
3. Formats publicitaires (bannière, pavé, interstitiel)
4. Magasins ciblés (import fichier, sélection, rayon de geofencing) — étape
   optionnelle, ne bloque jamais la progression
5. Catégories d'applications + résumé complet + création / enregistrement en brouillon

## 8. Endpoints API backend

Préfixe commun : **`/api`** (ex. `/api/health`). Toutes les routes sont
définies dans `backend/app/routes/` et enregistrées dans
`backend/app/routes/__init__.py`. La documentation interactive (Swagger)
reste la source la plus à jour : http://127.0.0.1:8000/docs.

### 8.1 Racine et santé

| Méthode | URL           | Rôle                          |
| ------- | -------------- | ------------------------------- |
| GET     | `/`             | Message d'accueil (nom du service, lien vers `/docs` et `/api/health`) — **hors préfixe `/api`** |
| GET     | `/api/health`   | Vérifie que l'API répond (liveness probe) |

```json
{"status": "ok", "service": "SBS Data Factory — Drive-to-Store DSP API", "version": "0.1.0"}
```

### 8.2 Utilisateurs (`/api/users`)

| Méthode | URL                        | Rôle                                                | Codes d'erreur      |
| ------- | ---------------------------- | ------------------------------------------------------ | ---------------------- |
| GET     | `/api/users`                  | Liste des utilisateurs (avec nom de l'annonceur associé) | —                      |
| POST    | `/api/users`                  | Crée un utilisateur                                      | `409` email déjà utilisé, `422` champs invalides |
| GET     | `/api/users/{user_id}`        | Détail d'un utilisateur                                  | `404` id inconnu       |
| PATCH   | `/api/users/{user_id}`        | Mise à jour partielle                                    | `404`, `409`           |
| PATCH   | `/api/users/{user_id}/status` | Change le statut (`active` / `invited` / `disabled`)     | `404`                  |

```json
// GET /api/users → 200
[
  {
    "id": 1,
    "name": "Aya ACHIBAN",
    "email": "aya.achiban@sbsdatafactory.ma",
    "role": "admin",
    "status": "active",
    "advertiser_id": null,
    "advertiser_name": null,
    "last_login": "2026-07-11T15:58:41.478556Z"
  }
]
```

### 8.3 Annonceurs (`/api/advertisers`)

| Méthode | URL                                      | Rôle                                            | Codes d'erreur |
| ------- | ------------------------------------------ | -------------------------------------------------- | ----------------- |
| GET     | `/api/advertisers`                          | Liste des annonceurs (avec nb. de campagnes / magasins) | —                  |
| GET     | `/api/advertisers/{advertiser_id}`          | Détail d'un annonceur                                | `404`              |
| PATCH   | `/api/advertisers/{advertiser_id}`          | Mise à jour partielle                                | `404`, `422` statut invalide |
| GET     | `/api/advertisers/{advertiser_id}/settings` | Paramètres de compte **propres à cet annonceur** (legacy, non utilisé par l'écran actuel — voir §11) | `404` |
| PATCH   | `/api/advertisers/{advertiser_id}/settings` | Met à jour ces paramètres par annonceur              | `404`              |

```json
// GET /api/advertisers → 200 (extrait)
{
  "id": 1,
  "name": "Marjane",
  "sector": "Grande distribution",
  "contact_name": "Yassine El Amrani",
  "phone": "+212 522 00 11 22",
  "email": "contact@marjane.ma",
  "address": "Route de Rabat, Aïn Sebaâ",
  "city": "Casablanca",
  "website": "https://www.marjane.ma",
  "status": "active",
  "campaigns_count": 1,
  "stores_count": 2
}
```

### 8.4 Paramètres du compte — globaux (`/api/account-settings`)

Ressource **unique** (pas de liste), utilisée par l'onglet « Paramètres » de
`/compte`. Distincte des paramètres par annonceur ci-dessus.

| Méthode | URL                    | Rôle                                            | Codes d'erreur |
| ------- | ------------------------ | -------------------------------------------------- | ----------------- |
| GET     | `/api/account-settings`   | Lit les paramètres globaux de la plateforme        | —                  |
| PUT     | `/api/account-settings`   | Remplace entièrement les paramètres (tous champs requis) | `422` si `company_name` absent |
| PATCH   | `/api/account-settings`   | Met à jour partiellement les paramètres            | —                  |

```json
// GET /api/account-settings → 200
{
  "company_name": "SBS Data Factory",
  "default_currency": "MAD",
  "timezone": "Africa/Casablanca",
  "language": "fr",
  "notification_email": null,
  "tracking_enabled": true,
  "updated_at": null
}
```

### 8.5 Magasins (`/api/stores`)

| Méthode | URL                        | Rôle                                                       | Codes d'erreur |
| ------- | ---------------------------- | ------------------------------------------------------------- | ----------------- |
| GET     | `/api/stores`                 | Liste de tous les magasins (jeu de données mocké)              | —                  |
| POST    | `/api/stores/import/preview`  | Analyse un fichier client (`.xlsx`/`.csv`, `multipart/form-data`, champ `file`) : valide chaque ligne, ne persiste rien | `400` fichier illisible / format non supporté |

```json
// POST /api/stores/import/preview → 200 (extrait)
{
  "filename": "stores.csv",
  "total_rows": 3,
  "valid_count": 3,
  "error_count": 0,
  "stores": [
    {
      "store_id": "M001",
      "name": "Marjane Californie",
      "city": "Casablanca",
      "address": "Bd Panoramique Californie",
      "latitude": 33.5298,
      "longitude": -7.6512,
      "opening_hours": "09:00 - 22:00",
      "store_url": "https://www.marjane.ma/californie"
    }
  ],
  "errors": [],
  "missing_columns": [],
  "message": "3 ligne(s) analysée(s) : toutes valides. Prêt pour l'import."
}
```

Colonnes obligatoires du fichier : `store_id`, `name`, `city`, `address`,
`latitude`, `longitude`, `opening_hours`, `store_url` (CSV `,` ou `;`, UTF-8
ou Windows-1252 ; `.xlsx` via openpyxl).

### 8.6 Campagnes (`/api/campaigns`)

| Méthode | URL                          | Rôle                                                   | Codes d'erreur |
| ------- | ------------------------------ | ---------------------------------------------------------- | ----------------- |
| GET     | `/api/campaigns`                | Liste des campagnes existantes (mock)                        | —                  |
| POST    | `/api/campaigns/drafts`         | Enregistre un brouillon (assistant multi-étapes) — **persisté réellement** (voir §11) | `422` validation |
| GET     | `/api/campaigns/drafts`         | Liste tous les brouillons, du plus récent au plus ancien     | —                  |
| GET     | `/api/campaigns/drafts/{draft_id}` | Détail d'un brouillon                                     | `404`              |

```json
// GET /api/campaigns → 200 (extrait)
{
  "id": 1,
  "advertiser_id": 1,
  "name": "Marjane Ramadan 2026",
  "objective": "drive_to_store",
  "status": "active",
  "start_date": "2026-03-01",
  "end_date": "2026-03-30",
  "total_budget": 50000,
  "daily_budget": 1667
}
```

### 8.7 Catalogue d'options campagne (`/api/campaign-creation`)

| Méthode | URL                             | Rôle                                                              |
| ------- | ---------------------------------- | ---------------------------------------------------------------------- |
| GET     | `/api/campaign-creation/options`    | Catalogue partagé frontend/backend : objectifs, annonceurs, appareils, OS, plages horaires, formats, catégories d'applications |

### 8.8 DCO — créatives (`/api/dco`)

| Méthode | URL                    | Rôle                                                                 | Codes d'erreur |
| ------- | ------------------------ | ------------------------------------------------------------------------- | ----------------- |
| POST    | `/api/dco/creatives`      | Enregistre les **métadonnées** d'un visuel (`multipart/form-data` : `file`, `format`, `advertiser_id`) — le fichier n'est jamais écrit sur disque | `400` format/type/taille invalide |
| GET     | `/api/dco/creatives`      | Liste les visuels enregistrés (filtre optionnel `?advertiser_id=`)         | —                  |

Formats acceptés : `banner`, `rectangle`, `interstitial`. Types de fichier :
PNG / JPEG / WEBP, 5 Mo maximum.

### 8.9 Statistiques / tableau de bord (`/api/statistics`)

| Méthode | URL                        | Rôle                                                        |
| ------- | ---------------------------- | ---------------------------------------------------------------- |
| GET     | `/api/statistics/dashboard`   | KPI agrégés + campagnes récentes + série de performance (Dashboard) |

### 8.10 Récapitulatif — tous les endpoints

```
GET    /api/health
GET    /api/users
POST   /api/users
GET    /api/users/{user_id}
PATCH  /api/users/{user_id}
PATCH  /api/users/{user_id}/status
GET    /api/advertisers
GET    /api/advertisers/{advertiser_id}
PATCH  /api/advertisers/{advertiser_id}
GET    /api/advertisers/{advertiser_id}/settings
PATCH  /api/advertisers/{advertiser_id}/settings
GET    /api/account-settings
PUT    /api/account-settings
PATCH  /api/account-settings
GET    /api/stores
POST   /api/stores/import/preview
GET    /api/campaigns
POST   /api/campaigns/drafts
GET    /api/campaigns/drafts
GET    /api/campaigns/drafts/{draft_id}
GET    /api/campaign-creation/options
POST   /api/dco/creatives
GET    /api/dco/creatives
GET    /api/statistics/dashboard
```

## 9. Schéma logique des entités

Le schéma **cible** PostgreSQL complet (colonnes, contraintes, index,
diagramme entité-relation) est détaillé dans
[`docs/schema-base-de-donnees.md`](schema-base-de-donnees.md). Résumé des
entités principales et de leurs relations :

| Entité                | Table PostgreSQL cible | Relation                                       | Statut aujourd'hui |
| ------------------------ | ------------------------- | -------------------------------------------------- | --------------------- |
| **Utilisateur**            | `users`                    | indépendante (pas encore reliée aux autres tables)  | Mock (liste enrichie du nom d'annonceur, en mémoire) |
| **Annonceur**               | `advertisers`               | 1 annonceur → N campagnes, N magasins                | Mock (en mémoire)      |
| **Campagne**                | `campaigns`                  | N campagnes → 1 annonceur ; 1 campagne → N créatives, N statistiques | Mock (en mémoire) + brouillons réellement persistés (`campaign_drafts`) |
| **Magasin**                  | `stores`                       | N magasins → 1 annonceur ; 1 magasin → N statistiques (optionnel) | Mock (en mémoire)      |
| **Créative (DCO)**            | `creatives` (modèle cible) / registre `dco_service.py` (aujourd'hui) | 1 créative → 1 campagne | Métadonnées en mémoire uniquement, aucun fichier stocké |
| **Statistique**                | `statistics`                    | 1 statistique → 1 campagne, 0-1 magasin              | Mock (en mémoire, non exposée par API dédiée — seulement agrégée dans `/api/statistics/dashboard`) |
| **Paramètres de compte**         | *(pas de table SQL — nouveauté Semaine 6)* | 1 par annonceur (legacy) + 1 singleton global | 100 % en mémoire, deux registres distincts (voir §11) |
| **Brouillon de campagne**          | `campaign_drafts` (migration `002_campaign_drafts.sql`) | 0-1 annonceur (nullable) | **Réellement persisté** (PostgreSQL si disponible, sinon SQLite local) |

```mermaid
erDiagram
    ADVERTISERS ||--o{ CAMPAIGNS : "possede"
    ADVERTISERS ||--o{ STORES : "possede"
    ADVERTISERS ||--o{ CAMPAIGN_DRAFTS : "possede (optionnel)"
    CAMPAIGNS ||--o{ CREATIVES : "contient"
    CAMPAIGNS ||--o{ STATISTICS : "genere"
    STORES ||--o{ STATISTICS : "genere (optionnel)"

    USERS {
        int id PK
        string name
        string email
        string role
        string status
        int advertiser_id FK "nullable"
    }
    ADVERTISERS {
        int id PK
        string name
        string sector
        string status
    }
    CAMPAIGNS {
        int id PK
        int advertiser_id FK
        string name
        string objective
        string status
        numeric total_budget
    }
    CAMPAIGN_DRAFTS {
        int id PK
        int advertiser_id FK "nullable"
        string name
        string status
        jsonb payload
    }
    STORES {
        int id PK
        int advertiser_id FK
        string name
        numeric latitude
        numeric longitude
    }
    CREATIVES {
        int id PK
        int campaign_id FK
        string format
    }
    STATISTICS {
        int id PK
        int campaign_id FK
        int store_id FK "nullable"
        date date
    }
```

> Ce diagramme est une vue condensée pour cette documentation. Le diagramme
> complet (avec toutes les colonnes, types et contraintes) se trouve dans
> [`docs/schema-base-de-donnees.md`](schema-base-de-donnees.md#5-relations-entre-les-tables).

## 10. Guide de test fonctionnel rapide

Parcours minimal pour vérifier que l'application est opérationnelle
(backend + frontend lancés, voir §4 et §5) :

1. **Connexion** — ouvrir http://localhost:5173, se connecter avec un email
   quelconque, rôle **Admin** → redirection vers `/dashboard`.
2. **Navigation** — cliquer sur chaque lien de la barre latérale
   (Dashboard, Campagnes, Magasins, Créations/DCO, Reporting, Gestion du
   compte) : chaque page doit s'afficher sans erreur, avec le bon élément de
   menu surligné et le bon fil d'Ariane.
3. **Campagnes** — `/campagnes` → « Créer une campagne » → remplir l'étape 1
   (nom, annonceur, objectif, dates, budget) → « Suivant » à travers les
   étapes 2 et 3 → à l'étape 4, importer un fichier magasins (voir
   `docs/samples/stores-valid.csv`) et sélectionner des magasins → étape 5 →
   « Enregistrer le brouillon » → retour à `/campagnes` : le brouillon doit
   apparaître dans « Vos brouillons ».
4. **Magasins** — `/magasins` → importer le même fichier → « Analyser le
   fichier » → vérifier que les lignes valides s'affichent dans le tableau et
   sur la carte, avec un rayon de ciblage réglable.
5. **DCO** — `/dco` → choisir un annonceur → uploader une image (PNG/JPEG/WEBP)
   sur un format → « Enregistrer les créatives » → « Générer toutes les
   variantes » → vérifier l'apparition de la « Galerie des variantes » et
   d'une landing page simulée pour un magasin.
6. **Reporting** — `/reporting` → changer le filtre Période et Ville/magasin
   → vérifier que les 4 indicateurs (KPI) et les graphiques se mettent à
   jour → cliquer « Exporter CSV » et vérifier que le fichier s'ouvre
   correctement dans Excel (accents, colonnes).
7. **Gestion du compte** — `/compte` → onglet Annonceurs : ouvrir une fiche,
   cliquer « Modifier », changer un champ, enregistrer → onglet
   Utilisateurs : ajouter un utilisateur test → onglet Paramètres :
   modifier un champ et « Enregistrer les paramètres », vérifier le message
   de succès.
8. **API directe (optionnel)** — dans un terminal :
   ```bash
   curl http://127.0.0.1:8000/api/health
   curl http://127.0.0.1:8000/api/advertisers
   curl http://127.0.0.1:8000/api/account-settings
   ```
9. **Qualité du code** :
   ```bash
   cd frontend && npm run lint && npm run build
   ```

## 11. Limites actuelles

- **Aucune base PostgreSQL connectée par défaut** : la quasi-totalité des
  données (utilisateurs, annonceurs, magasins, campagnes, créatives DCO,
  paramètres de compte) vivent **en mémoire** dans le processus backend
  (`app/services/mock_data.py` et les registres dédiés) et sont
  **réinitialisées à chaque redémarrage** du serveur `uvicorn`.
- **Exception : les brouillons de campagne** (`POST /api/campaigns/drafts`)
  sont réellement persistés via `app/services/draft_store.py` — dans
  PostgreSQL si `DATABASE_URL` est joignable, sinon automatiquement dans un
  fichier SQLite local (`backend/.local/campaign_drafts.db`, ignoré par
  Git). C'est la seule donnée qui survit à un redémarrage aujourd'hui.
- **Modèles SQLAlchemy non alignés sur le schéma cible complet** : par
  exemple `User` n'a pas de `password_hash` ni de lien vers un annonceur au
  niveau base de données (voir [`schema-base-de-donnees.md` §8](schema-base-de-donnees.md#8-limites-actuelles)
  pour le détail).
- **Deux registres distincts de « paramètres de compte »**, sans lien
  formel entre eux : les paramètres **par annonceur**
  (`/api/advertisers/{id}/settings`, introduits en premier) et les
  paramètres **globaux** (`/api/account-settings`, utilisés aujourd'hui par
  l'écran Gestion du compte). Aucune table SQL ne modélise cette entité pour
  l'instant — à harmoniser lors du passage à PostgreSQL.
- **Aucune authentification réelle** : le login accepte n'importe quel
  couple email / mot de passe ; le rôle est choisi librement sur le
  formulaire. Il n'y a ni hachage de mot de passe, ni jeton de session, ni
  vérification côté serveur — toute la logique d'accès (garde de route,
  actions visibles) est appliquée **côté frontend uniquement**. Une vraie
  authentification (mot de passe haché, session/JWT, contrôle d'accès côté
  API) reste à implémenter.
- **DCO : aucun fichier réellement stocké** — seules les métadonnées d'un
  visuel uploadé (nom, type, taille) sont enregistrées ; l'aperçu affiché
  dans le navigateur utilise un objet local temporaire
  (`URL.createObjectURL`), jamais renvoyé par le serveur.
- **Landing pages 100 % simulées** — générées et affichées uniquement dans
  la page `/dco` (pas de route publique réelle), à partir des champs du
  magasin et du premier visuel disponible. Les URLs de magasin
  (`store_url`) issues des données de démonstration ne sont **jamais
  cliquables** dans l'interface (texte informatif uniquement), car elles ne
  correspondent pas à de vraies pages en ligne.
- **Reporting** : KPI, graphiques et carte reposent sur des données
  générées côté frontend (`frontend/src/data/reportingData.js`), pas sur de
  vraies statistiques agrégées depuis le backend.
- **Pas de tests automatisés** (unitaires ou end-to-end) à ce stade — la
  validation reste manuelle (voir §10 et le journal
  `docs/etat-avancement-semaine-6.md`).
- **CORS restreint aux serveurs de développement Vite** (`localhost:5173`,
  `localhost:5174`, `127.0.0.1:5173`) — à étendre pour un environnement de
  déploiement réel.

## 12. Déploiement — pistes conceptuelles

> Aucune configuration de déploiement (conteneur, pipeline CI/CD,
> hébergement) n'existe encore dans ce dépôt. Cette section décrit des
> pistes **génériques et conceptuelles**, à affiner lorsque le projet
> passera en environnement réel — elle ne décrit pas un mécanisme déjà en
> place.

### Frontend (React/Vite)

- Le frontend se compile en fichiers **statiques** avec `npm run build`
  (dossier `frontend/dist/`).
- Ces fichiers peuvent être servis par n'importe quel hébergeur de contenu
  statique (ex. Nginx, ou une plateforme de type hébergement statique
  géré) — aucun serveur Node.js n'est nécessaire en production.
- Avant le build, définir `VITE_API_URL` pour pointer vers l'URL publique du
  backend (voir §6).

### Backend (FastAPI)

- FastAPI s'exécute via un serveur **ASGI** (Uvicorn utilisé en
  développement ; en production, on ajoute généralement plusieurs workers,
  par exemple via Uvicorn avec l'option `--workers`, ou un gestionnaire de
  process dédié).
- Variables à fournir dans l'environnement de déploiement :
  `DATABASE_URL` (vraie base PostgreSQL), `BACKEND_CORS_ORIGINS` (domaine
  public du frontend).
- Une fois `DATABASE_URL` pointée vers une base réelle, exécuter les
  migrations SQL versionnées (`database/migrations/001_initial_schema.sql`,
  puis `002_campaign_drafts.sql`) avant de démarrer l'API.

### Base de données

- PostgreSQL managé (ou auto-hébergé), avec sauvegardes régulières —
  aucune stratégie de sauvegarde n'est définie à ce stade puisque la base
  n'est pas encore utilisée en production.

### Ordre de mise en service suggéré

1. Provisionner PostgreSQL, appliquer les migrations SQL.
2. Déployer le backend avec `DATABASE_URL` renseignée, vérifier
   `GET /api/health`.
3. Construire et déployer le frontend avec `VITE_API_URL` pointant vers le
   backend déployé.
4. Mettre à jour `BACKEND_CORS_ORIGINS` côté backend avec le domaine public
   du frontend.

Ces étapes restent **indicatives** : aucun script d'automatisation
(Dockerfile, pipeline CI/CD) n'existe encore dans ce dépôt à la date de ce
document.
