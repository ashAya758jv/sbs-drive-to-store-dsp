# État d'avancement — Semaine 4

**Module : Sélection des magasins & import de la BDD client**

> Ce document suit l'avancement de la Semaine 4, jour par jour. Il complète la
> Semaine 3 (création de campagne multi-étapes), sans modifier les modules déjà
> validés (dashboard, login, campagnes, création de campagne).

---

## Jour 1 — Import de la BDD client (parsing + validation)

### Objectif

Permettre à un media buyer d'importer, depuis la page **Magasins**, le fichier
de base de données client des points de vente (`.xlsx` ou `.csv`), de le
**valider** ligne par ligne, et d'obtenir un **aperçu clair** avant tout import :
magasins valides d'un côté, erreurs localisées de l'autre. Aucune donnée n'est
encore persistée (l'import réel et la carte interactive viendront ensuite).

### Colonnes obligatoires attendues

`store_id`, `name`, `city`, `address`, `latitude`, `longitude`,
`opening_hours`, `store_url` (l'ordre des colonnes n'a pas d'importance, seuls
les intitulés comptent, insensibles à la casse).

### Règles de validation appliquées

| Champ | Règle |
| --- | --- |
| `store_id` | Obligatoire, **unique** dans le fichier |
| `name`, `city`, `address`, `opening_hours` | Obligatoires (non vides) |
| `latitude` | Obligatoire, numérique, comprise entre **-90 et 90** |
| `longitude` | Obligatoire, numérique, comprise entre **-180 et 180** |
| `store_url` | Obligatoire, doit ressembler à une URL (`http(s)://…` ou `www.…`) |

- Si une **colonne obligatoire manque**, l'analyse renvoie un message clair
  listant les colonnes absentes (aucune ligne n'est analysée).
- Si une **ligne contient des erreurs**, chaque erreur est renvoyée avec son
  **numéro de ligne** (tel qu'il apparaît dans le fichier), le **champ concerné**
  et un **message explicite**.
- Tolérances pratiques : séparateur CSV `,` **ou** `;` (exports Excel FR),
  décimales à la virgule (`33,58`), encodage UTF-8 ou Windows-1252, lignes
  entièrement vides ignorées.

### Fonctionnalités réalisées

**Backend**
- Service de parsing/validation isolé : `backend/app/services/store_import_service.py`.
- Schémas Pydantic : `backend/app/schemas/store_import.py`
  (`ImportedStore`, `RowError`, `StoreImportPreview`).
- Route dédiée : `backend/app/routes/store_import.py`, enregistrée dans le
  routeur principal (`backend/app/routes/__init__.py`).
- Lecture `.csv` via la bibliothèque standard (`csv`), `.xlsx` via `openpyxl`.
- Garde-fous : format refusé hors `.xlsx`/`.csv`, fichier vide, taille max 5 Mo,
  fichier Excel illisible → message d'erreur HTTP 400 clair.

**Frontend** (page `/magasins`, dans le style existant : cartes blanches, violet)
- Carte **« Import BDD client »** avec zone d'upload `.xlsx`/`.csv` (état visuel
  quand un fichier est sélectionné) et bouton **« Analyser le fichier »**.
- Appel de l'endpoint en `multipart/form-data` (`frontend/src/data/storesApi.js`,
  helper `apiUpload` dans `frontend/src/lib/api.js`).
- **Résumé** de l'analyse : lignes analysées / valides / en erreur.
- **Tableau des magasins valides** (id, nom, ville, adresse, coordonnées,
  horaires, URL).
- **Bloc d'erreurs** rouge : numéro de ligne, champ, message ; plus un bloc
  ambre dédié aux colonnes manquantes.
- **Exemple des colonnes attendues** affiché dans l'interface.

### Endpoints ajoutés

| Méthode | URL | Description |
| --- | --- | --- |
| POST | `/api/stores/import/preview` | Analyse un fichier `.xlsx`/`.csv` (multipart) et renvoie l'aperçu d'import (compteurs, magasins valides, erreurs par ligne, message global). |

Réponse (`StoreImportPreview`) : `filename`, `total_rows`, `valid_count`,
`error_count`, `stores[]`, `errors[]` (`{row, field, message}`),
`missing_columns[]`, `message`.

Les endpoints existants sont inchangés (`/api/health`, `/api/users`,
`/api/advertisers`, `/api/stores`, `/api/campaigns`, `/api/campaigns/drafts`,
`/api/campaign-creation/options`, `/api/statistics/dashboard`).

### Dépendances ajoutées

- `python-multipart>=0.0.9` — nécessaire à FastAPI pour les uploads
  `multipart/form-data`.
- `openpyxl>=3.1` — lecture des fichiers `.xlsx`.

### Tests à faire

**Backend**
```bash
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt        # installe python-multipart + openpyxl
uvicorn app.main:app --reload
# Swagger : http://127.0.0.1:8000/docs → vérifier POST /api/stores/import/preview
```

**Frontend**
```bash
cd frontend
npm run dev          # http://localhost:5173 → page Magasins
# 1) importer un fichier correct  → résumé vert + tableau des magasins valides
# 2) importer un fichier avec erreurs → bloc rouge (ligne, champ, message)
npm run build        # doit passer
```

Exemple de fichier CSV de test valide :
```csv
store_id,name,city,address,latitude,longitude,opening_hours,store_url
101,Marjane Californie,Casablanca,Bd Panoramique,33.5298,-7.6512,09:00 - 22:00,https://www.marjane.ma/californie
102,Carrefour Anfa,Casablanca,Anfa Place,33.6020,-7.6700,09:00 - 23:00,https://www.carrefour.ma/anfa
```

### Limites actuelles

- L'import est en mode **aperçu uniquement** : les magasins validés **ne sont
  pas encore persistés** en base (pas d'écriture en base à ce stade).
- Pas encore de **carte interactive** ni de géofencing (prévus **Jour 2**).
- Pas de rattachement à un **annonceur** ni de déduplication vis-à-vis des
  magasins déjà existants côté base.
- Validation d'URL volontairement **souple** (forme générale), pas de
  vérification que le lien est réellement accessible.
- Formats supportés : `.xlsx` et `.csv` (pas `.xls` ancien format ni Google
  Sheets).

### Prochaines étapes (Jour 2 et suivants)

1. Persister les magasins importés (endpoint d'import définitif + base).
2. Afficher les magasins sur une **carte interactive** et gérer le géofencing.
3. Rattacher les magasins à un annonceur et gérer les doublons avec l'existant.

---

## Jour 2 — Carte interactive

### Objectif

Visualiser géographiquement, directement sur la page **Magasins**, les
magasins **valides** issus de l'analyse du Jour 1 (aucune modification du
parsing/validation, aucune persistance ajoutée à ce stade).

### Ajout de la carte

- Nouveau composant dédié et autonome :
  `frontend/src/components/stores/StoreMap.jsx`.
- Solution technique : **Leaflet** + tuiles **OpenStreetMap**, choisie parce
  qu'elle **ne nécessite aucune clé API** (contrairement à Google Maps /
  Mapbox), ce qui garantit que la démo fonctionne immédiatement en local.
- Dépendance npm ajoutée : **`leaflet` (^1.9.4)** — seule nouvelle dépendance,
  `package.json` et `package-lock.json` mis à jour via `npm install leaflet`.
- La carte s'affiche automatiquement **après une analyse réussie**, juste
  sous le tableau « Magasins valides » (page `frontend/src/pages/StoreSelection.jsx`),
  sans toucher à l'interface d'import existante (upload, résumé, tableau,
  bloc d'erreurs restent inchangés).

### Affichage des marqueurs

- Un **marqueur violet** (couleur SBS, `brand.primary` de `styles/theme.js`)
  par magasin valide, positionné avec ses coordonnées `latitude`/`longitude`.
- **Centrage et zoom automatiques** sur l'ensemble des magasins affichés
  (`fitBounds` s'il y en a plusieurs, centrage direct si un seul).
- **Popup au clic** sur un marqueur, avec : nom du magasin, ville + adresse,
  horaires d'ouverture, et un lien **« Voir la fiche magasin → »** vers
  `store_url` (uniquement s'il est renseigné).
- Sécurité : le contenu du popup est construit avec des **nœuds DOM
  (`textContent`)**, jamais avec du HTML injecté — les données viennent d'un
  fichier importé par l'utilisateur et ne doivent jamais être interprétées
  comme du markup.
- **État vide** : si aucun magasin valide n'est disponible (avant toute
  analyse, ou si une analyse ne produit aucune ligne valide), un message
  propre s'affiche à la place de la carte : *« Aucun magasin importé pour
  l'instant »*, dans le même style que le reste de l'interface (pas
  d'instance Leaflet créée inutilement dans ce cas).
- Un **compteur** (« *N* magasin(s) affiché(s) sur la carte ») accompagne le
  titre **« Carte des magasins importés »** et le sous-titre
  **« Visualisation géographique des points de vente validés »**.

### Données utilisées

La carte réutilise directement `preview.stores` — le tableau des magasins
**déjà validés** par l'analyse du Jour 1 (issu de `POST
/api/stores/import/preview`), sans nouvel appel réseau ni nouvel état
dupliqué. Aucun changement backend n'a été nécessaire.

### Tests effectués

- `npm run build` ✅ et `npm run lint` ✅.
- Vérification navigateur avec le fichier d'exemple
  `docs/samples/stores-valid.csv` : 3 marqueurs affichés, vue centrée sur
  Casablanca/Rabat, popup correct au clic (nom, ville · adresse, horaires,
  lien cliquable vers `store_url`).
- Vérification de l'état vide avec un fichier ne produisant aucune ligne
  valide : message propre affiché, compteur à 0, aucune carte Leaflet montée.
- Vérification que le dashboard, le login, la sidebar, les campagnes et la
  création de campagne ne sont pas affectés.

### État actuel et limites

- La carte est **en lecture seule** : pas de clic pour ajouter/éditer un
  magasin, pas de géofencing (rayon autour d'un point de vente) — prévu à une
  étape ultérieure.
- Les tuiles proviennent du serveur public **OpenStreetMap** (`tile.openstreetmap.org`) :
  suffisant pour la démo locale, mais à remplacer par un fournisseur de tuiles
  dédié (ou une clé Google Maps/Mapbox) avant un usage en production à fort
  volume, pour respecter leur politique d'usage.
- Aucune donnée n'est persistée : la carte ne montre que la dernière analyse
  en mémoire (elle se réinitialise si la page est rechargée).
- Pas encore de clustering de marqueurs : au-delà de quelques dizaines de
  magasins très proches, l'affichage individuel restera lisible mais pourra
  être densifié (amélioration future si le volume de magasins augmente).
