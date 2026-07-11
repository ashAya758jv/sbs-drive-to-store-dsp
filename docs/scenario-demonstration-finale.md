# Scénario de démonstration finale — Semaine 6

> Support de présentation pour la démonstration devant l'encadrante SBS.
> S'appuie uniquement sur les fonctionnalités **réellement présentes dans le
> code** à ce jour (branche `docs/week6-demo-preparation`). Voir
> [`docs/documentation-technique.md`](documentation-technique.md) pour le
> détail technique complet et
> [`docs/etat-avancement-semaine-6.md`](etat-avancement-semaine-6.md) pour le
> journal jour par jour.

## Objectif de la démonstration

Montrer, de bout en bout, le parcours d'un utilisateur de la plateforme
**Drive-to-Store DSP** : de la connexion jusqu'au reporting, en passant par
la création d'une campagne, l'import des magasins, la génération des
créatives (DCO) et la gestion du compte — puis présenter la documentation
technique et l'API interactive (Swagger).

L'objectif n'est **pas** de présenter un produit fini connecté à une vraie
base de données, mais un **prototype fonctionnel de bout en bout** sur
données mockées, qui valide l'ensemble des parcours utilisateur prévus pour
le stage.

## Prérequis avant la démo

- Node.js 18+ et Python 3.10+ installés.
- Dépendances installées (`npm install` dans `frontend/`,
  `pip install -r requirements.txt` dans l'environnement virtuel du
  `backend/`).
- Un fichier magasins d'exemple prêt : `docs/samples/stores-valid.csv`
  (déjà présent dans le dépôt, aucune préparation supplémentaire).
- Le backend **redémarré juste avant la démo**, pour repartir sur les
  données mockées d'origine (aucune donnée de test résiduelle d'une session
  précédente — voir [`docs/checklist-demonstration-finale.md`](checklist-demonstration-finale.md)).
- Navigateur avec le cache vidé / une fenêtre de navigation privée, pour
  éviter tout bundle frontend mis en cache par une session de développement
  antérieure.

## Commandes pour lancer le backend

```bash
cd backend
# Si l'environnement virtuel existe déjà :
.\.venv\Scripts\Activate.ps1        # Windows PowerShell
# source .venv/bin/activate         # macOS / Linux

uvicorn app.main:app --reload
```

- API : **http://127.0.0.1:8000**
- Vérification rapide : `curl http://127.0.0.1:8000/api/health`
- Swagger : **http://127.0.0.1:8000/docs**

## Commandes pour lancer le frontend

```bash
cd frontend
npm run dev
```

- Application : **http://localhost:5173**

---

## Parcours exact à montrer pendant la démo

### 1. Connexion à l'application

**À montrer** : ouvrir `http://localhost:5173` → écran de connexion → saisir
un email quelconque et un mot de passe quelconque → choisir le rôle
**Admin** → « Se connecter ».

**Texte oral** :
> « L'authentification est aujourd'hui simulée : n'importe quel email et mot
> de passe sont acceptés, et je choisis un rôle pour illustrer le contrôle
> d'accès. Il existe trois rôles : Admin, Media buyer et Lecteur, chacun
> avec un accès différent au menu. »

**Point technique à mentionner** : le rôle est stocké côté navigateur
(`localStorage`), il n'y a pas encore de vérification côté serveur — c'est
une simplification assumée pour le prototype (voir limites plus bas).

### 2. Dashboard

**À montrer** : `/dashboard` → 4 indicateurs clés (impressions, clics,
budget dépensé, campagnes actives) → graphique de performance → tableau des
campagnes récentes → cliquer « Voir tout » (renvoie vers `/campagnes`).

**Texte oral** :
> « Le dashboard donne une vue d'ensemble immédiate : les indicateurs clés,
> l'évolution des performances et les dernières campagnes. C'est l'écran
> d'accueil de tout utilisateur connecté. »

**Point technique** : ces données proviennent de
`GET /api/statistics/dashboard`, un endpoint backend dédié qui agrège des
données mockées — prêt à être branché sur de vraies statistiques une fois
PostgreSQL en place.

### 3. Gestion des campagnes

**À montrer** : `/campagnes` → section « Vos brouillons » (vide ou avec un
brouillon existant) → section « Toutes les campagnes » (4 campagnes de
démonstration : active, en pause, brouillon, terminée).

**Texte oral** :
> « Cet écran liste les campagnes existantes et les brouillons en cours de
> création. C'est le point d'entrée pour créer une nouvelle campagne. »

**Point technique** : la liste « Vos brouillons » est **réellement branchée**
au backend (`GET /api/campaigns/drafts`) ; la table « Toutes les campagnes »
affiche pour l'instant des données de démonstration côté frontend
(honnêteté à assumer si la question est posée — voir limites).

### 4. Création d'une campagne

**À montrer** : bouton « Créer une campagne » → étape 1 : nom, annonceur,
objectif, dates, budget → « Suivant » → étape 2 : appareils et systèmes
d'exploitation → étape 3 : formats publicitaires → étape 4 : magasins
ciblés (voir point 5) → étape 5 : catégories d'applications + résumé →
« Enregistrer le brouillon » (à n'importe quelle étape) ou « Créer la
campagne » (à la dernière étape) → retour à `/campagnes` : la campagne
apparaît dans « Vos brouillons ».

**Texte oral** :
> « La création de campagne se fait en 5 étapes guidées. On peut à tout
> moment enregistrer un brouillon même incomplet, ou aller jusqu'au bout
> pour valider une campagne complète. »

**Point technique** : `POST /api/campaigns/drafts` — c'est la **seule
donnée réellement persistée** aujourd'hui côté backend (PostgreSQL si
disponible, sinon un fichier SQLite local de secours) ; si l'API est
injoignable, le brouillon est quand même sauvegardé localement dans le
navigateur (`localStorage`) pour que la démo ne soit jamais bloquée.

### 5. Import / validation des magasins

**À montrer** : soit à l'étape 4 de l'assistant, soit directement sur
`/magasins` → « Cliquez pour choisir un fichier » → sélectionner
`docs/samples/stores-valid.csv` → « Analyser le fichier » → résultat
d'analyse (lignes valides / en erreur) → tableau des magasins avec cases à
cocher → « Tout sélectionner » → réglage du rayon de geofencing (1 à 20 km,
5 km par défaut) → carte interactive avec un marqueur et un cercle par
magasin sélectionné.

**Texte oral** :
> « L'annonceur importe sa base de magasins au format Excel ou CSV. Le
> système valide chaque ligne — colonnes obligatoires, coordonnées GPS,
> format d'URL — et signale précisément les erreurs. On sélectionne ensuite
> les magasins à cibler et on ajuste leur rayon de diffusion, visualisé sur
> la carte. »

**Point technique** : validation côté serveur
(`POST /api/stores/import/preview`), carte **OpenStreetMap + Leaflet**
(aucune clé Google Maps requise). Ce composant est **partagé** entre
`/magasins` et l'étape 4 de l'assistant — même comportement aux deux
endroits.

### 6. Génération DCO / variantes

**À montrer** : `/dco` → sélectionner un annonceur (champs dynamiques du
premier magasin pré-remplis) → uploader une image sur un format (bannière,
pavé ou interstitiel) → « Enregistrer les créatives » → « Générer toutes les
variantes » → section « Comparaison par magasin » → « Galerie des
variantes » → « Landing pages personnalisées » → sélectionner un magasin →
« Prévisualiser la landing page » → cliquer « Voir la fiche magasin »
(affiche un encart « lien simulé pour la démo », **sans jamais ouvrir une
page externe**).

**Texte oral** :
> « Cette page illustre le DCO (Dynamic Creative Optimization) : à partir
> d'un seul visuel, on génère automatiquement une variante par magasin, avec
> les informations propres à chaque point de vente. On peut comparer deux
> magasins côte à côte, parcourir la galerie complète, et prévisualiser une
> landing page personnalisée simulée pour chaque magasin. »

**Point technique** : seules les **métadonnées** du visuel sont envoyées et
enregistrées côté serveur (`POST /api/dco/creatives`) — aucun fichier n'est
stocké sur disque à ce stade. La génération des variantes et des landing
pages est calculée **côté frontend**. Toutes les URLs de magasin affichées
sont volontairement **du texte non cliquable** (jamais un vrai lien externe)
car les données de démonstration ne pointent pas vers de vraies pages.

### 7. Reporting : filtres, KPI, graphiques, carte, tableau, export CSV

**À montrer** : `/reporting` → changer le filtre **Période** (7 jours / 30
jours / ce mois) → changer le filtre **Ville / magasin** → observer les 4
KPI et les graphiques se mettre à jour → lire la synthèse textuelle
automatique → carte des zones de diffusion (marqueurs + rayons) → tableau
détaillé par magasin, trier une colonne → « Exporter CSV » → ouvrir le
fichier téléchargé (dans Excel si possible) pour montrer que les accents et
colonnes s'affichent correctement.

**Texte oral** :
> « Le reporting permet de suivre la performance des campagnes selon
> différents filtres, avec des indicateurs, des graphiques, une carte des
> zones de diffusion et un tableau par magasin triable et exportable en
> CSV. »

**Point technique** : la liste des magasins et des villes provient du
véritable endpoint `GET /api/stores` ; en revanche, les indicateurs de
performance (impressions, clics, dépense) sont **générés côté frontend** à
ce stade (données de démonstration réalistes, pas encore de vraies
statistiques agrégées). L'export CSV inclut un BOM UTF-8 et un séparateur
`;` pour une compatibilité Excel garantie, y compris avec les accents.

### 8. Gestion du compte : annonceurs, utilisateurs, paramètres

**À montrer** : `/compte` → onglet **Annonceurs** : rechercher/filtrer,
ouvrir une fiche, « Modifier », changer un champ, enregistrer → onglet
**Utilisateurs** : rechercher/filtrer par rôle, « Ajouter un utilisateur »,
puis activer/désactiver un utilisateur → onglet **Paramètres** : modifier un
champ (devise, fuseau horaire, langue, email de notification, tracking),
« Enregistrer les paramètres », montrer le message de succès.

**Texte oral** :
> « Cet écran centralise l'administration : la fiche de chaque annonceur, la
> gestion des utilisateurs et leurs rôles, et les paramètres globaux de la
> plateforme. Seul le rôle Admin peut modifier ces données — les autres
> rôles y accèdent en lecture seule. »

**Point technique** : entièrement branché sur l'API (`GET/PATCH
/api/advertisers`, `GET/POST/PATCH /api/users`, `GET/PUT/PATCH
/api/account-settings`), avec des erreurs HTTP explicites (404 si un id est
inconnu, 409 si un email est déjà utilisé, 422 si un champ est invalide).

### 9. Documentation technique / Swagger API

**À montrer** : ouvrir `http://127.0.0.1:8000/docs` → montrer la liste des
endpoints groupés par ressource → dérouler et **exécuter** un exemple (ex.
`GET /api/advertisers`) directement depuis Swagger → mentionner
`docs/documentation-technique.md` comme référence écrite complète.

**Texte oral** :
> « Chaque endpoint de l'API est documenté et testable directement depuis
> cette interface Swagger, générée automatiquement par FastAPI. En
> complément, un document technique récapitule l'architecture, l'ensemble
> des routes et les limites actuelles du prototype. »

---

## Points techniques à mentionner devant l'encadrante

- **Stack** : React 19 + Vite côté frontend, FastAPI + Pydantic v2 côté
  backend, communication en JSON via une API REST sous le préfixe `/api`.
- **Contrôle d'accès par rôle** : trois rôles (Admin, Media buyer, Lecteur),
  appliqués à la fois sur la navigation (menu adapté) et sur les actions
  disponibles à l'écran (ex. seul un Admin peut modifier la Gestion du
  compte).
- **Architecture prête pour PostgreSQL** : les modèles SQLAlchemy et les
  migrations SQL existent déjà (`backend/app/models/`,
  `database/migrations/`), mais la base n'est pas connectée par défaut — le
  backend sert des données en mémoire pour rester testable sans
  installation de base de données.
- **Une seule donnée réellement persistée** : les brouillons de campagne
  (le reste redémarre à zéro à chaque relance du serveur — assumé et
  documenté).
- **Documentation à jour** : `docs/documentation-technique.md` (architecture,
  installation, 24 endpoints avec exemples), `docs/schema-base-de-donnees.md`
  (schéma PostgreSQL cible), et un journal d'avancement détaillé
  (`docs/etat-avancement-semaine-3.md` à `semaine-6.md`).

## Limites actuelles du prototype

À énoncer clairement si la question est posée (transparence assumée) :

- **Données mockées / en mémoire** pour la quasi-totalité de l'application
  (utilisateurs, annonceurs, magasins, campagnes existantes, créatives DCO,
  paramètres de compte) — réinitialisées à chaque redémarrage du backend.
  Seuls les **brouillons de campagne** survivent à un redémarrage.
- **PostgreSQL n'est pas branché** aujourd'hui : les modèles et les
  migrations SQL sont prêts, mais le backend fonctionne actuellement sans
  base de données réelle.
- **Authentification simulée** : pas de mot de passe vérifié, pas de jeton
  de session, le contrôle d'accès n'est appliqué que côté navigateur.
- **DCO** : les fichiers uploadés ne sont pas stockés (seules leurs
  métadonnées le sont) ; les **landing pages sont entièrement simulées**
  (aucune route publique réelle, aperçu affiché dans la page elle-même).
- **Reporting** : indicateurs et graphiques générés côté frontend (données
  de démonstration réalistes), pas encore de vraies statistiques agrégées
  depuis la base.
- **La liste complète des campagnes** (`/campagnes`, section « Toutes les
  campagnes ») reste sur des données mockées côté frontend ; seuls les
  brouillons créés via l'assistant sont réellement branchés à l'API.
- **Pas de tests automatisés** à ce stade — la validation du parcours a été
  faite manuellement (voir `docs/etat-avancement-semaine-6.md`, section
  Jour 3).

## Conclusion de la démonstration

> « Ce prototype couvre l'intégralité du parcours utilisateur prévu pour le
> stage : connexion, tableau de bord, création de campagne, import et
> ciblage des magasins, génération de créatives DCO, reporting complet avec
> export, et administration du compte — le tout avec une interface
> cohérente et une API backend documentée et testable. Les prochaines
> étapes naturelles sont le branchement réel de PostgreSQL, une
> authentification sécurisée, et la mise en place de tests automatisés,
> comme détaillé dans la documentation technique. »
