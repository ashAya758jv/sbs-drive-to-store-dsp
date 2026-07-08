# État d'avancement — Semaine 5

**Module : DCO (Dynamic Creative Optimization) & Reporting**

> Ce document suit l'avancement de la Semaine 5, jour par jour. Il complète la
> Semaine 4 (import BDD magasins, carte interactive, sélection, geofencing,
> intégration au parcours de création de campagne), sans modifier les modules
> déjà validés (dashboard, login, campagnes, création de campagne, magasins).

---

## Jour 1 — Bloc 4.1 : upload des visuels publicitaires

### Objectif

Remplacer le placeholder de la page **Créations / DCO** par un premier module
fonctionnel : upload des visuels par format publicitaire (bannière, pavé,
interstitiel), avec des champs dynamiques pré-remplis depuis la base client,
en préparation des variantes par magasin (générées à une étape ultérieure).

### Fonctionnalités réalisées

**Frontend** (page `/dco`, style existant : cartes blanches, violet)
- **Sélection d'un annonceur** (menu déroulant, réutilise le catalogue
  `GET /api/campaign-creation/options` déjà utilisé par le formulaire de
  campagne — même liste, même style de `Select`).
- **Bloc « Champs dynamiques client »** : nom du magasin, ville, adresse,
  horaires, URL — pré-remplis automatiquement à partir du **premier magasin**
  de l'annonceur sélectionné (`GET /api/stores`, filtré côté frontend par
  `advertiser_id`, sans modifier l'endpoint existant). Si aucun magasin n'est
  disponible (API hors ligne), un exemple générique est affiché à la place.
  Un texte explique que ces champs serviront à générer automatiquement les
  variantes de créative par magasin.
- **Trois zones d'upload indépendantes** : Bannière, Pavé, Interstitiel
  (mêmes libellés/descriptions que dans le formulaire de création de
  campagne, réutilisés depuis le même catalogue d'options). Pour chaque
  format :
  - description du format attendu ;
  - zone de sélection de fichier (image) ;
  - nom du fichier choisi ;
  - **aperçu visuel** (généré côté client via `URL.createObjectURL`, aucune
    dépendance serveur pour l'affichage) ;
  - **badge d'état** : « En attente » / « Fichier invalide » / « Prêt à
    enregistrer » / « Enregistré ».
- **Validation** :
  - seuls les formats **PNG, JPG/JPEG, WEBP** sont acceptés (vérifiés côté
    client sur le type MIME du fichier) ; tout autre type affiche une erreur
    claire et empêche le fichier d'être retenu ;
  - le bouton **« Enregistrer les créatives »** est **désactivé** tant
    qu'aucun visuel valide n'a été ajouté, avec un message explicite
    (« Ajoutez au moins un visuel... »).
- À l'enregistrement, chaque visuel prêt est envoyé au backend
  (`POST /api/dco/creatives`, `multipart/form-data`), puis passe à l'état
  « Enregistré » ; un message de succès récapitule le nombre de visuels
  enregistrés.

**Backend**
- Nouveau service **en mémoire** (aucune base PostgreSQL requise) :
  `backend/app/services/dco_service.py` — enregistre les **métadonnées**
  de chaque upload (annonceur, format, nom de fichier, type MIME, taille,
  date), sans écrire les fichiers sur disque. Le registre est réinitialisé au
  redémarrage du serveur, comme `mock_data.py`.
- Schéma Pydantic : `backend/app/schemas/dco.py` (`DcoAssetRead`).
- Route dédiée : `backend/app/routes/dco.py`, enregistrée dans le routeur
  principal (`backend/app/routes/__init__.py`).
- Validations serveur (défense en profondeur, en plus du contrôle client) :
  format d'emplacement publicitaire reconnu (`banner`/`rectangle`/
  `interstitial`), type MIME accepté, fichier non vide, taille max 5 Mo.

### Endpoints ajoutés

| Méthode | URL | Description |
| --- | --- | --- |
| POST | `/api/dco/creatives` | Enregistre les métadonnées d'un visuel (`multipart/form-data` : `file`, `format`, `advertiser_id`). Ne stocke pas le fichier sur disque. |
| GET | `/api/dco/creatives` | Liste les visuels enregistrés (filtre optionnel `?advertiser_id=`). |

Les endpoints existants sont inchangés (`/api/health`, `/api/users`,
`/api/advertisers`, `/api/stores`, `/api/stores/import/preview`,
`/api/campaigns`, `/api/campaigns/drafts`, `/api/campaign-creation/options`,
`/api/statistics/dashboard`).

### Tests effectués

- `npm run build` ✅ et `npm run lint` ✅ (0 warning).
- Backend : upload PNG/WEBP valides → `201` ; format d'emplacement inconnu,
  type MIME invalide, fichier vide → `400` avec message clair ; liste globale
  et filtrée par annonceur ✅.
- Navigateur (parcours complet) : changement d'annonceur → champs dynamiques
  mis à jour en direct (données réelles issues de `GET /api/stores`) ;
  fichier `.txt` déposé sur une zone → erreur affichée, badge « Fichier
  invalide » ; fichiers PNG/JPEG valides → aperçu affiché, badge « Prêt à
  enregistrer » ; clic « Enregistrer les créatives » →
  `POST /api/dco/creatives` × 2 → **201 Created** pour chacun, badges passés
  à « Enregistré », message de succès affiché.
- Dashboard, Campagnes, Magasins vérifiés inchangés après ces ajouts.

### Ce qui est fait / ce qu'il reste à faire

**Fait (Jour 1)**
- Upload fonctionnel par format (bannière, pavé, interstitiel) avec
  validation de type et aperçu visuel.
- Champs dynamiques client pré-remplis (exemple réel + repli générique).
- Enregistrement des métadonnées côté backend (in-memory).

**Reste à faire (prochains jours de la Semaine 5)**
- Génération automatique des **variantes par magasin** à partir des champs
  dynamiques (actuellement affichés à titre indicatif seulement).
- Rattachement d'un visuel à une **campagne** précise (pour l'instant, les
  visuels sont liés à un annonceur, pas encore à une campagne/brouillon).
- Persistance réelle des fichiers (stockage disque ou objet) — hors scope du
  Jour 1, qui reste volontairement mock/in-memory.
- Bloc Reporting (prévu plus tard dans la Semaine 5, cf. nom de la branche
  `feat/week5-dco-reporting`).

### Limites actuelles

- Les fichiers uploadés **ne sont pas persistés** sur disque : seules leurs
  métadonnées sont conservées en mémoire (perdues au redémarrage du backend).
- Le registre en mémoire n'est pas partagé entre plusieurs instances/process
  du backend (limite acceptable pour une démo locale).
- Pas encore de lien explicite entre un visuel DCO et une campagne/brouillon
  particulier.
