# SBS Data Factory — Drive-to-Store DSP

Plateforme web DSP **Drive-to-Store** développée dans le cadre du stage PFA chez
SBS Data Factory. L'application permet aux annonceurs de créer, gérer et suivre
des campagnes publicitaires visant à générer des visites en magasin.

> Périmètre : application web fullstack professionnelle (React + FastAPI +
> PostgreSQL). Il ne s'agit **pas** d'un bidder RTB temps réel ni d'un backend
> OpenRTB.

## Stack technique

| Couche          | Technologies                                              |
| --------------- | --------------------------------------------------------- |
| Frontend        | React (Vite), React Router DOM, Tailwind CSS              |
| Icônes          | lucide-react                                              |
| Visualisation   | Recharts                                                  |
| Backend (à venir) | FastAPI                                                  |
| Base de données (à venir) | PostgreSQL                                      |
| Cartographie (à venir) | Google Maps API / Mapbox                           |

La première version du frontend fonctionne avec des **données mockées**
(`src/data/mockData.js`) et une **authentification simulée** via `localStorage`.

## Structure du projet

```
sbs-drive-to-store-dsp/
├── frontend/                 # Application React (Vite)
│   └── src/
│       ├── auth/             # Contexte d'authentification mock (rôles)
│       ├── components/
│       │   ├── layout/       # AppLayout, Sidebar, Header, Breadcrumb, PageHeader
│       │   ├── ui/           # Button, Card, Badge, Select
│       │   ├── charts/       # PerformanceChart (Recharts)
│       │   └── common/       # PlaceholderPage
│       ├── data/             # mockData.js (KPIs, campagnes, navigation…)
│       ├── pages/            # Login, Dashboard, et les modules à venir
│       ├── routes/           # AppRouter (routing + gardes par rôle)
│       ├── styles/           # theme.js (tokens partagés JS, ex. couleurs charts)
│       ├── lib/              # utilitaires (cn)
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css         # Thème Tailwind (couleurs, fonts)
├── backend/                  # FastAPI (à venir)
├── database/                 # Modèle PostgreSQL (à venir)
├── docs/                     # Maquettes, notes techniques, benchmark
└── README.md
```

## Installation et lancement (frontend)

Prérequis : **Node.js 18+** et **npm**.

```bash
# 1. Se placer dans le dossier frontend
cd frontend

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

Le serveur Vite démarre sur **http://localhost:5173**.

### Autres commandes

```bash
npm run build     # build de production (dossier dist/)
npm run preview   # prévisualiser le build de production
npm run lint      # vérifier le code avec ESLint
```

### Connexion (démo)

L'authentification est simulée : n'importe quel email / mot de passe est
accepté. Sélectionnez un **rôle** pour explorer l'accès correspondant :

- **Admin** — accès à tous les modules (compte de démonstration : Aya ACHIBAN).
- **Media buyer** — tout sauf la gestion du compte.
- **Lecteur** — Dashboard, Magasins et Reporting (lecture seule).

La navigation latérale s'adapte automatiquement au rôle sélectionné.

## État actuel

**Semaine 2 — Fondation technique du frontend ✅**

- [x] Structure de projet propre et composants réutilisables
- [x] Page de connexion + authentification simulée (localStorage)
- [x] Système de rôles (Admin, Media buyer, Lecteur)
- [x] Layout global : sidebar, header, fil d'Ariane, routing
- [x] Dashboard d'accueil avec données mockées (KPIs, graphique, tableau)
- [x] Pages placeholder pour les modules à venir

## Prochains modules

1. **Création de campagne** — assistant multi-étapes (objectif, budget, période).
2. **Sélection des magasins** — points de vente et géofencing (carte).
3. **Créations / DCO** — bibliothèque de créatives et optimisation dynamique.
4. **Reporting** — tableaux de bord détaillés et exports.
5. **Gestion du compte** — utilisateurs, rôles et paramètres de l'annonceur.
6. **Backend FastAPI + PostgreSQL** — remplacement progressif des données mockées.
