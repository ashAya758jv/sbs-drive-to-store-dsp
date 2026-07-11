# Livraison finale — Semaine 6 · SBS Data Factory · Drive-to-Store DSP

> Document de synthèse remis à l'encadrante SBS à l'issue de la Semaine 6.
> Il résume l'état livré du projet et renvoie vers les documents détaillés
> du dépôt plutôt que de les dupliquer. Voir en particulier
> [`docs/documentation-technique.md`](documentation-technique.md) (référence
> technique complète), [`docs/scenario-demonstration-finale.md`](scenario-demonstration-finale.md)
> (script de démo) et [`docs/etat-avancement-semaine-6.md`](etat-avancement-semaine-6.md)
> (journal jour par jour, Jour 1 à Jour 6).

## Résumé du projet

**Drive-to-Store DSP** est une plateforme web permettant à des annonceurs de
créer, cibler et suivre des campagnes publicitaires dont l'objectif est de
générer des **visites en magasin**. Développée dans le cadre d'un stage PFA
chez SBS Data Factory, elle couvre le parcours complet : création de
campagne, ciblage géographique des points de vente, génération de créatives
personnalisées par magasin (DCO), reporting de performance et
administration du compte.

Il s'agit d'une application web fullstack (**React + FastAPI**), et non d'un
bidder RTB temps réel ni d'un backend OpenRTB.

## Périmètre livré

- Un **frontend React/Vite** complet, avec authentification simulée par
  rôle, navigation protégée, et 7 écrans fonctionnels reliés entre eux par
  un parcours cohérent.
- Un **backend FastAPI** exposant **24 endpoints REST** documentés et
  testables via Swagger, avec validation des données (Pydantic v2) et
  gestion d'erreurs HTTP explicite (404 / 409 / 422).
- Une **architecture prête pour PostgreSQL** : modèles SQLAlchemy et
  migrations SQL versionnées existent déjà (voir
  [`docs/schema-base-de-donnees.md`](schema-base-de-donnees.md)), mais la
  base **n'est pas branchée en production** à ce stade — le backend
  fonctionne sur des données mockées en mémoire pour rester testable sans
  installation de base de données.
- Une **persistance réelle limitée aux brouillons de campagne**
  (PostgreSQL si disponible, sinon un fichier SQLite local de secours
  côté backend) — c'est la seule donnée qui survit à un redémarrage du
  serveur aujourd'hui.
- Une **documentation complète** : technique, fonctionnelle, schéma de
  données, scénario et checklist de démonstration, journal d'avancement
  hebdomadaire.

## Modules livrés

| Module | Route(s) | État |
| --- | --- | --- |
| Connexion / navigation par rôle | `/login`, garde de route sur toutes les pages | ✅ Fonctionnel (auth simulée) |
| Dashboard | `/dashboard` | ✅ Fonctionnel (KPI, graphique, campagnes récentes via `GET /api/statistics/dashboard`) |
| Gestion des campagnes | `/campagnes` | ✅ Fonctionnel (liste + brouillons réellement branchés à l'API) |
| Création de campagne | `/campagnes/nouvelle` | ✅ Fonctionnel (assistant en 5 étapes, enregistrement en brouillon persisté) |
| Import & ciblage des magasins | `/magasins` (+ étape 4 de l'assistant) | ✅ Fonctionnel (import `.xlsx`/`.csv` validé côté serveur, sélection, geofencing, carte Leaflet/OpenStreetMap) |
| Créations / DCO | `/dco` | ✅ Fonctionnel (upload de visuels, génération de variantes par magasin, landing pages simulées) |
| Reporting | `/reporting` | ✅ Fonctionnel (filtres, KPI, graphiques, carte des zones, tableau triable, export CSV) |
| Gestion du compte | `/compte` | ✅ Fonctionnel (annonceurs, utilisateurs, paramètres globaux — édition réservée au rôle Admin) |
| API & documentation | `http://127.0.0.1:8000/docs` | ✅ Swagger interactif + documentation écrite |

## État technique actuel

- **Frontend** : React 19 + Vite, React Router DOM, Tailwind CSS v4,
  Recharts (graphiques), Leaflet + OpenStreetMap (cartographie).
- **Backend** : FastAPI + Pydantic v2 + pydantic-settings, SQLAlchemy 2 (ORM
  prêt pour PostgreSQL), Uvicorn comme serveur ASGI.
- **Persistance** : en mémoire pour la quasi-totalité de l'application
  (utilisateurs, annonceurs, magasins, campagnes existantes, créatives DCO,
  paramètres de compte) — réinitialisée à chaque redémarrage du backend ;
  seuls les **brouillons de campagne** sont réellement persistés.
- **PostgreSQL** : non branché par défaut. Modèles SQLAlchemy et deux
  migrations SQL versionnées (`database/migrations/001_initial_schema.sql`,
  `002_campaign_drafts.sql`) prêts à être appliqués.
- **Authentification** : simulée (aucun mot de passe vérifié, aucun jeton de
  session réel) ; le contrôle d'accès par rôle est appliqué côté frontend.
- **Qualité** : `npm run lint` et `npm run build` passent sans erreur ;
  validation fonctionnelle manuelle complète effectuée et documentée
  (`docs/etat-avancement-semaine-6.md`, Jour 3) ; pas encore de tests
  automatisés.

## Commandes pour lancer le backend

```bash
cd backend
# Environnement virtuel (une seule fois) :
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows PowerShell
# source .venv/bin/activate         # macOS / Linux
pip install -r requirements.txt

# Lancement :
uvicorn app.main:app --reload
```

- API : **http://127.0.0.1:8000**
- Vérification : `curl http://127.0.0.1:8000/api/health`
- Swagger : **http://127.0.0.1:8000/docs**

## Commandes pour lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

- Application : **http://localhost:5173**

## Endpoints principaux

Liste complète et exemples de réponse dans
[`docs/documentation-technique.md` §8](documentation-technique.md#8-endpoints-api-backend).
Aperçu des endpoints les plus représentatifs (24 au total) :

| Méthode | URL | Rôle |
| --- | --- | --- |
| GET | `/api/health` | Vérifie que l'API répond |
| GET | `/api/statistics/dashboard` | KPI + campagnes récentes + série de performance |
| GET / POST | `/api/campaigns/drafts` | Liste / crée un brouillon de campagne (**seule donnée réellement persistée**) |
| GET | `/api/campaign-creation/options` | Catalogue d'options de l'assistant (objectifs, formats, appareils…) |
| POST | `/api/stores/import/preview` | Analyse et valide un fichier magasins (`.xlsx`/`.csv`) |
| GET | `/api/stores` | Liste des magasins |
| POST / GET | `/api/dco/creatives` | Enregistre / liste les métadonnées des visuels DCO |
| GET / PATCH | `/api/advertisers`, `/api/advertisers/{id}` | Liste et édition des annonceurs |
| GET / POST / PATCH | `/api/users`, `/api/users/{id}`, `/api/users/{id}/status` | Gestion des utilisateurs |
| GET / PUT / PATCH | `/api/account-settings` | Paramètres globaux du compte |

## Liens / documents utiles dans le dépôt

| Document | Contenu |
| --- | --- |
| [`README.md`](../README.md) | Présentation générale (⚠️ encore au niveau Semaine 2, à rafraîchir — voir limites) |
| [`docs/documentation-technique.md`](documentation-technique.md) | Architecture, structure des dossiers, installation, 24 endpoints avec exemples, schéma des entités, limites, pistes de déploiement |
| [`docs/schema-base-de-donnees.md`](schema-base-de-donnees.md) | Schéma PostgreSQL cible détaillé (tables, contraintes, ERD) |
| [`docs/scenario-demonstration-finale.md`](scenario-demonstration-finale.md) | Script de démonstration en 9 étapes, texte oral, points techniques |
| [`docs/checklist-demonstration-finale.md`](checklist-demonstration-finale.md) | Checklists avant/pendant/après démo, erreurs courantes et solutions, ordre de captures d'écran |
| [`docs/etat-avancement-semaine-6.md`](etat-avancement-semaine-6.md) | Journal détaillé Jour 1 à Jour 6 de la Semaine 6 |
| [`docs/etat-avancement-semaine-3.md`](etat-avancement-semaine-3.md) → [`semaine-5.md`](etat-avancement-semaine-5.md) | Historique des semaines précédentes |
| [`docs/samples/stores-valid.csv`](samples/stores-valid.csv) | Fichier d'exemple pour tester l'import de magasins |

## Scénario de démonstration (résumé)

Parcours complet en 9 étapes, détaillé dans
[`docs/scenario-demonstration-finale.md`](scenario-demonstration-finale.md) :

1. **Connexion** — authentification simulée, choix du rôle.
2. **Dashboard** — indicateurs clés, graphique, campagnes récentes.
3. **Gestion des campagnes** — liste et brouillons.
4. **Création d'une campagne** — assistant en 5 étapes, enregistrement en
   brouillon (persisté réellement).
5. **Import / validation des magasins** — fichier client, sélection, rayon
   de geofencing, carte.
6. **DCO / génération de variantes** — upload de visuel, variantes par
   magasin, comparaison, galerie, landing pages simulées.
7. **Reporting** — filtres, KPI, graphiques, carte des zones, tableau, export CSV.
8. **Gestion du compte** — annonceurs, utilisateurs, paramètres (édition
   réservée à l'Admin).
9. **Documentation technique / Swagger** — API testable en direct + doc écrite.

## Limites honnêtes du prototype

- **Données mockées / en mémoire** pour la quasi-totalité de l'application ;
  seuls les brouillons de campagne survivent à un redémarrage du backend.
- **PostgreSQL non branché en production** : préparé (modèles + migrations),
  mais pas connecté par défaut aujourd'hui.
- **Authentification simulée** : aucune vérification de mot de passe, aucun
  jeton de session, contrôle d'accès appliqué côté frontend uniquement.
- **DCO** : aucun fichier réellement stocké (métadonnées uniquement) ;
  **landing pages entièrement simulées** (pas de route publique réelle).
- **Reporting** : indicateurs et graphiques générés côté frontend (données
  de démonstration réalistes), pas encore de vraies statistiques agrégées.
- **`/campagnes` (liste complète)** reste sur des données mockées côté
  frontend ; seuls les brouillons créés via l'assistant sont réellement
  branchés à l'API.
- **Pas de tests automatisés** — validation fonctionnelle réalisée
  manuellement et documentée (Jour 3 du journal Semaine 6).
- **`README.md` et `backend/README.md`** ne reflètent pas encore l'état
  actuel du projet (encore rédigés au niveau Semaine 2 / endpoints
  partiels) — la référence à jour est `docs/documentation-technique.md`.

## Prochaines améliorations possibles

1. Brancher réellement PostgreSQL (`DATABASE_URL`, exécution des migrations
   SQL existantes) et remplacer progressivement les services mockés par de
   vraies requêtes SQLAlchemy.
2. Mettre en place une authentification sécurisée (mot de passe haché,
   session ou JWT, contrôle d'accès vérifié côté API et non plus seulement
   côté frontend).
3. Persister réellement les créatives DCO (stockage fichier) et les
   variantes générées.
4. Remplacer les données de reporting mockées par de vraies statistiques
   agrégées depuis la base.
5. Brancher `/campagnes` (liste complète) sur `GET /api/campaigns` au lieu
   des données mockées frontend actuelles.
6. Ajouter des tests automatisés (unitaires backend, end-to-end frontend).
7. Mettre à jour `README.md` et `backend/README.md` pour refléter l'état
   réel du projet.
8. Définir une stratégie de déploiement concrète (actuellement seulement
   des pistes conceptuelles — voir `docs/documentation-technique.md` §12).

## Conclusion — prête à envoyer à l'encadrante

> À l'issue de la Semaine 6, la plateforme Drive-to-Store DSP dispose d'un
> **prototype fonctionnel de bout en bout** : connexion, tableau de bord,
> création de campagne, import et ciblage des magasins, génération de
> créatives DCO personnalisées par magasin, reporting complet avec export,
> et administration du compte — le tout appuyé sur une API backend
> documentée et testable (24 endpoints, Swagger interactif) et une
> documentation écrite complète (architecture, schéma de données, scénario
> et checklist de démonstration).
>
> Le projet reste, par choix assumé à ce stade, construit sur des données
> mockées / en mémoire (à l'exception des brouillons de campagne, réellement
> persistés) et sur une authentification simulée, afin de valider
> l'ensemble du parcours utilisateur avant d'investir dans le branchement
> réel de PostgreSQL et d'une authentification sécurisée — deux chantiers
> pour lesquels l'architecture est déjà prête (modèles SQLAlchemy,
> migrations SQL versionnées). Ces limites, ainsi que les prochaines étapes
> proposées, sont détaillées ci-dessus en toute transparence.
