# État d'avancement — Semaine 6

**Module : Gestion du compte (Annonceurs, Utilisateurs, Paramètres)**

> Ce document suit l'avancement de la Semaine 6, jour par jour. Il complète la
> Semaine 5 (DCO, variantes, landing pages, reporting), sans modifier les
> modules déjà validés (dashboard, login, campagnes, magasins, DCO,
> reporting).

---

## Jour 1 — Écran « Gestion du compte » fonctionnel

### Objectif

Remplacer le placeholder de la page **Gestion du compte** (`/compte`, 4
onglets statiques sans logique) par un écran réellement fonctionnel à **3
onglets** — Annonceurs, Utilisateurs, Paramètres — connectés à l'API FastAPI,
avec permissions par rôle (admin vs lecture seule pour media_buyer/lecteur).

### Fonctionnalités réalisées

**Onglet Annonceurs** (`components/account/AdvertisersTab.jsx`)
- Tableau : nom, secteur, ville, statut, nombre de campagnes, nombre de
  magasins, action (« Voir la fiche »).
- Recherche par nom (`Input`) et filtre par statut (« Tous les statuts » /
  Actif / Inactif).
- Clic sur une ligne → **fiche détaillée** dans une modale (nom, secteur,
  adresse, ville, email, téléphone, site web, statut, avec le nombre de
  campagnes/magasins en en-tête).
- Bouton **« Modifier »** (visible uniquement pour le rôle admin) → formulaire
  dans une seconde modale, avec validation (nom obligatoire, email valide si
  renseigné) et sauvegarde via `PATCH /api/advertisers/{id}`.
- États : chargement, erreur (avec bouton « Réessayer »), liste vide.

**Onglet Utilisateurs** (`components/account/UsersTab.jsx`)
- Tableau : nom, email, rôle, annonceur associé, statut, dernière connexion,
  actions (colonne masquée pour les non-admins).
- Recherche par nom et filtre par rôle (admin / media_buyer / lecteur).
- Bouton **« Ajouter un utilisateur »** (admin uniquement) → modale de
  création avec validation (nom obligatoire, email au format valide, rôle
  obligatoire) ; sauvegarde via `POST /api/users`.
- Bouton **« Modifier »** par ligne (admin uniquement) → même formulaire,
  pré-rempli, sauvegarde via `PATCH /api/users/{id}`.
- Bouton **« Activer » / « Désactiver »** par ligne (admin uniquement) →
  `PATCH /api/users/{id}/status`.
- Message de succès affiché (et auto-masqué après quelques secondes) après
  chaque ajout/modification/changement de statut.
- États : chargement, erreur (avec bouton « Réessayer »), liste vide.

**Onglet Paramètres** (`components/account/SettingsTab.jsx`)
- Sélecteur d'annonceur (tous rôles), puis formulaire de paramètres pour
  l'annonceur choisi : nom d'affichage, devise (MAD par défaut), fuseau
  horaire (Africa/Casablanca par défaut), langue (Français par défaut), email
  de notification, notifications activées/désactivées (`Toggle`).
- Bouton **« Enregistrer les paramètres »** (admin uniquement) →
  `PATCH /api/advertisers/{id}/settings`, avec message de succès affiché après
  sauvegarde.
- Pour media_buyer/lecteur : tous les champs sont affichés en lecture seule
  (contrôles désactivés), sans bouton d'enregistrement.

**Permissions**
- Un booléen `isAdmin` (calculé une fois dans `AccountManagement.jsx` via
  `useAuth().user.role === ROLES.ADMIN`) est transmis aux trois onglets et
  conditionne l'affichage de tous les boutons de mutation (Modifier, Ajouter,
  Activer/Désactiver, Enregistrer). Les rôles `media_buyer` et `lecteur`
  (équivalent du « viewer » demandé — l'application utilise déjà `lecteur`
  comme valeur d'énumération `UserRole.READER`, aucun nouveau rôle n'a été
  ajouté) voient toutes les données mais aucun contrôle de modification.
- La page `/compte` et l'entrée de menu correspondante étaient auparavant
  réservées au rôle admin (`RequireRole roles={[ROLES.ADMIN]}` dans
  `AppRouter.jsx`, et `roles: [ROLES.ADMIN]` dans `navItems` de
  `mockData.js`). Ces deux points ont été élargis à
  `[ROLES.ADMIN, ROLES.MEDIA_BUYER, ROLES.READER]` pour permettre l'accès en
  lecture seule demandé — c'est la seule modification apportée à des fichiers
  partagés par le reste de l'application ; aucune autre page n'est affectée.

**Backend**
- `backend/app/services/mock_data.py` : les annonceurs mockés ont gagné
  `address`, `city`, `website`, `status` ; les utilisateurs mockés ont gagné
  `advertiser_id` et `last_login`. Aucune table SQL, aucune migration.
- `backend/app/schemas/advertiser.py` : `AdvertiserRead` étendu (nouveaux
  champs + `campaigns_count`/`stores_count` calculés) et nouveau
  `AdvertiserUpdate` (validation : nom non vide, statut ∈ {active, inactive}).
- `backend/app/schemas/user.py` : `UserRead` étendu (`advertiser_id`,
  `advertiser_name`, `last_login`) et nouveaux `UserCreate`, `UserUpdate`,
  `UserStatusUpdate`.
- `backend/app/schemas/account_settings.py` (nouveau) : `AccountSettingsRead`
  / `AccountSettingsUpdate` (devise, fuseau horaire, langue, email de
  notification, notifications activées, horodatage de dernière sauvegarde).
- `backend/app/services/advertisers_service.py` : ajout de `get_advertiser`
  (404 si id inconnu) et `update_advertiser` (PATCH partiel), en plus de
  `list_advertisers` (désormais enrichi du nombre de campagnes/magasins
  calculé à partir de `mock_data.CAMPAIGNS`/`STORES`).
- `backend/app/services/users_service.py` : ajout de `get_user`, `create_user`
  (avec détection d'email en double → `DuplicateEmailError`), `update_user`,
  `set_user_status`, en plus de `list_users` (désormais enrichi du nom
  d'annonceur associé).
- `backend/app/services/account_settings_service.py` (nouveau) : paramètres
  par annonceur, stockés en mémoire (`dict` indexé par `advertiser_id`), avec
  valeurs par défaut dérivées de l'annonceur (nom, email) la première fois
  qu'ils sont demandés.
- `backend/app/routes/advertisers.py` et `backend/app/routes/users.py` :
  routes étendues (voir tableau ci-dessous), chaque exception métier
  (`AdvertiserNotFoundError`, `UserNotFoundError`, `DuplicateEmailError`)
  convertie en `HTTPException` avec un message clair (404 ou 409).

**Frontend — infrastructure partagée**
- `frontend/src/lib/api.js` : ajout de `apiPatch` (PATCH JSON) et
  factorisation de la lecture du message d'erreur (`detail`) entre `apiPost`
  et `apiPatch`, sur le même principe que `apiUpload`.
- `frontend/src/components/ui/Modal.jsx` (nouveau) : modale générique
  (overlay, titre/sous-titre, bouton de fermeture, fermeture à l'Échap),
  réutilisée pour toutes les fiches/formulaires des trois onglets.
- `frontend/src/data/accountApi.js` (nouveau) : couche d'appel API dédiée
  (`getAdvertisers`, `getAdvertiser`, `updateAdvertiser`,
  `getAccountSettings`, `updateAccountSettings`, `getUsers`, `createUser`,
  `updateUser`, `setUserStatus`), plus les libellés/options de statut et de
  rôle utilisés par les trois onglets.

### Endpoints ajoutés / modifiés

| Méthode | URL | Description |
| --- | --- | --- |
| GET | `/api/advertisers` | *(existant, enrichi)* liste des annonceurs, avec `address`, `city`, `website`, `status`, `campaigns_count`, `stores_count`. |
| GET | `/api/advertisers/{id}` | **Nouveau.** Détail d'un annonceur. 404 si id inconnu. |
| PATCH | `/api/advertisers/{id}` | **Nouveau.** Mise à jour partielle d'un annonceur. 404 si id inconnu, 422 si statut invalide. |
| GET | `/api/advertisers/{id}/settings` | **Nouveau.** Paramètres de compte de l'annonceur (valeurs par défaut si jamais enregistrés). 404 si id inconnu. |
| PATCH | `/api/advertisers/{id}/settings` | **Nouveau.** Enregistre les paramètres de compte de l'annonceur. 404 si id inconnu. |
| GET | `/api/users` | *(existant, enrichi)* liste des utilisateurs, avec `advertiser_id`, `advertiser_name`, `last_login`. |
| POST | `/api/users` | **Nouveau.** Crée un utilisateur. 409 si email déjà utilisé, 422 si champs invalides/manquants. |
| GET | `/api/users/{id}` | **Nouveau.** Détail d'un utilisateur. 404 si id inconnu. |
| PATCH | `/api/users/{id}` | **Nouveau.** Mise à jour partielle d'un utilisateur. 404 si id inconnu, 409 si email déjà utilisé. |
| PATCH | `/api/users/{id}/status` | **Nouveau.** Change le statut (active/invited/disabled) d'un utilisateur. 404 si id inconnu. |

Les endpoints existants sont inchangés (`/api/health`, `/api/stores`,
`/api/stores/import/preview`, `/api/campaigns`, `/api/campaigns/drafts`,
`/api/campaign-creation/options`, `/api/dco/creatives`,
`/api/statistics/dashboard`).

### Tests effectués

- `npm run build` ✅ et `npm run lint` ✅ (0 warning) — voir détail plus bas.
- Backend, en isolant chaque service puis via un serveur uvicorn réellement
  démarré (`Invoke-RestMethod`, car `httpx`/`TestClient` ne sont pas installés
  dans ce venv) : liste des annonceurs (champs enrichis), détail (404 sur id
  inconnu), PATCH (puis retour à la valeur d'origine), 422 sur statut
  invalide, liste des utilisateurs (jointure `advertiser_name`), création
  (201), 409 sur email en double, 422 sur rôle manquant, PATCH utilisateur,
  changement de statut, 404 sur id inconnu, GET/PATCH des paramètres de
  compte (valeurs par défaut puis persistées) — **16/16 vérifications
  passées**.
- Navigateur (parcours complet, rôle admin) :
  - Onglet Annonceurs : fiche « Marjane » ouverte, secteur modifié puis
    enregistré (`PATCH /api/advertisers/1` → 200, valeur mise à jour dans le
    tableau), puis revert à la valeur d'origine.
  - Onglet Utilisateurs : validation testée (soumission vide bloquée avec
    messages d'erreur), création d'un utilisateur test (`POST /api/users` →
    201, apparition immédiate dans le tableau), désactivation testée
    (`PATCH /api/users/{id}/status` → 200, badge mis à jour).
  - Onglet Paramètres : formulaire pré-rempli (MAD, Africa/Casablanca,
    Français, email de contact de l'annonceur), sauvegarde testée → message
    « Paramètres enregistrés avec succès. » affiché.
  - Rôle **lecteur** (viewer) : reconnecté avec ce rôle, `/compte` reste
    accessible ; onglet Annonceurs → fiche sans bouton « Modifier » ; onglet
    Utilisateurs → aucun bouton « Ajouter un utilisateur », colonne Actions
    absente du tableau ; onglet Paramètres → tous les champs désactivés,
    aucun bouton « Enregistrer ». Confirme le cloisonnement des permissions.
  - Backend redémarré après les tests pour repartir sur les données mockées
    d'origine (aucune donnée de test laissée en mémoire).
- Dashboard, Campagnes, Magasins, Créations/DCO, Reporting, création de
  campagne vérifiés inchangés après ces ajouts.

### Choix techniques

- **Rôle « viewer »** : la consigne mentionne les rôles admin/media_buyer/
  viewer, mais l'application dispose déjà d'un rôle `lecteur`
  (`UserRole.READER = "lecteur"`) avec le même sens. Plutôt que d'ajouter un
  rôle redondant, `lecteur` a été réutilisé partout comme équivalent de
  « viewer », y compris dans le sélecteur de rôle du formulaire utilisateur
  (libellé affiché : « Lecteur (viewer) »).
- **Accès de `/compte` élargi** : pour que media_buyer/lecteur puissent
  effectivement voir l'écran en lecture seule (exigence explicite de la
  consigne), la route et l'entrée de menu — auparavant strictement admin —
  ont été élargies aux trois rôles. Le contrôle fin des actions reste porté
  par `isAdmin` à l'intérieur de chaque onglet.
- **Paramètres remontés par annonceur, pas par utilisateur connecté** :
  l'utilisateur mock actuel n'a pas d'`advertiser_id` propre (compte
  transverse Aya ACHIBAN), donc l'onglet Paramètres propose un sélecteur
  d'annonceur plutôt que de déduire un annonceur unique de la session.
- **Remontage par `key` plutôt que ré-effet sur changement d'annonceur** :
  le formulaire de paramètres (`AdvertiserSettingsForm`) est remonté via
  `key={advertiserId}` à chaque changement d'annonceur au lieu de réagir à un
  changement de prop dans un `useEffect` existant — pattern nécessaire pour
  rester conforme à la règle ESLint `react-hooks/set-state-in-effect` (interdit
  d'appeler `setState` de façon synchrone dans un effet), tout en réinitialisant
  proprement chargement/erreur/succès à chaque sélection.

### Ce qui est fait / ce qu'il reste à faire

**Fait (Jour 1)**
- 3 onglets fonctionnels (Annonceurs, Utilisateurs, Paramètres) connectés à
  l'API FastAPI, avec recherche, filtres, fiche détaillée, formulaires de
  création/modification, activation/désactivation.
- Permissions par rôle (admin = édition, media_buyer/lecteur = lecture
  seule), accès en lecture seule à `/compte` élargi à ces deux rôles.
- Endpoints backend complets pour annonceurs, utilisateurs et paramètres de
  compte, avec erreurs HTTP claires (404/409/422).

**Reste à faire (au-delà du Jour 1)**
- Persistance réelle (PostgreSQL) — actuellement 100 % en mémoire, comme le
  reste de l'application à ce stade.
- Invitation par email réelle pour un utilisateur au statut « invited »
  (actuellement un statut affiché, sans envoi d'email).
- Historique d'activité / journal des modifications du compte.
- Suppression définitive d'un annonceur ou d'un utilisateur (non demandée ce
  Jour 1 ; seules la désactivation et la modification sont prévues).

### Limites actuelles

- **Persistance en mémoire uniquement** : comme `mock_data.py`,
  `dco_service.py` et `draft_store.py` des semaines précédentes, toutes les
  données (annonceurs, utilisateurs, paramètres de compte) sont réinitialisées
  au redémarrage du backend. Aucune base PostgreSQL n'est utilisée pour ce
  Jour 1, conformément à la consigne.
- Le rôle « viewer » de la consigne correspond au rôle `lecteur` déjà présent
  dans l'application — aucun rôle distinct n'a été créé.
- Le compte utilisateur connecté (mock, sans vrai backend d'authentification)
  n'est pas rattaché à un annonceur précis ; l'onglet Paramètres nécessite
  donc de choisir l'annonceur à consulter/modifier via un sélecteur.
- Pas de pagination sur les tableaux Annonceurs/Utilisateurs (acceptable au
  volume actuel de données mockées).

---

## Jour 2 — Onglet Paramètres branché sur l'API globale `/api/account-settings`

### Objectif

Un test manuel post-Jour 1 a montré que `GET /api/account-settings` (ressource
plate, sans annonceur) répondait `404` : au Jour 1, les paramètres n'avaient
été exposés qu'en tant que ressource **imbriquée**
`/api/advertisers/{id}/settings`. Ce Jour 2 corrige et termine le sujet :
- côté backend, ajoute l'endpoint plat manquant ;
- côté frontend, reconnecte l'onglet **Paramètres** sur cette ressource
  globale (paramètres de la plateforme SBS Data Factory), à la place du
  sélecteur d'annonceur du Jour 1 — l'onglet affichait encore des données
  liées à l'annonceur sélectionné (ex. « Marjane », `contact@marjane.ma`), ce
  qui n'est plus le cas.

### Backend — endpoint plat ajouté

- `backend/app/routes/account_settings.py` (**nouveau**) : `GET`, `PUT` et
  `PATCH /api/account-settings`, enregistré dans
  `backend/app/routes/__init__.py`.
- `backend/app/schemas/account_settings.py` : ajout de
  `GlobalAccountSettingsRead` / `GlobalAccountSettingsWrite` (PUT, tous les
  champs requis) / `GlobalAccountSettingsUpdate` (PATCH, tous les champs
  optionnels), avec les noms de champs demandés — `company_name`,
  `default_currency`, `timezone`, `language`, `notification_email`,
  `tracking_enabled`, `updated_at`. Volontairement **distincts** des noms
  utilisés par les paramètres par annonceur du Jour 1 (`display_name`,
  `currency`, `notifications_enabled`) : ce sont deux ressources séparées, pas
  un renommage.
- `backend/app/services/account_settings_service.py` : ajout d'un singleton
  en mémoire `_GLOBAL_SETTINGS` (indépendant du dict par annonceur du Jour 1)
  avec `get_global_settings`, `replace_global_settings` (PUT, remplacement
  complet) et `patch_global_settings` (PATCH, fusion partielle).
- L'endpoint imbriqué `/api/advertisers/{id}/settings` du Jour 1 **reste
  exposé** (rien n'a été retiré côté backend), mais n'est plus appelé par
  aucun écran depuis cette correction.

### Frontend — onglet Paramètres reconnecté

- `frontend/src/data/accountApi.js` : les anciennes fonctions
  `getAccountSettings(advertiserId)` / `updateAccountSettings(advertiserId,
  payload)` (ressource imbriquée) sont remplacées par
  `getGlobalAccountSettings()` (`GET /account-settings`) et
  `updateGlobalAccountSettings(payload)` (`PATCH /account-settings`).
- `frontend/src/components/account/SettingsTab.jsx` — réécrit :
  - suppression du sélecteur d'annonceur et du sous-composant remonté par
    `key={advertiserId}` (devenus inutiles : il n'y a plus qu'une seule
    ressource, chargée une fois au montage) ;
  - champs affichés : **Nom de l'entreprise** (`company_name`, obligatoire),
    **Devise** (`default_currency`), **Fuseau horaire** (`timezone`),
    **Langue** (`language`), **Email de notification**
    (`notification_email`), **Tracking activé** (`tracking_enabled`, via le
    composant `Toggle` déjà utilisé au Jour 1) ;
  - bouton **« Enregistrer les paramètres »** → `PATCH /api/account-settings`
    via `updateGlobalAccountSettings`, avec le même message de success
    (« Paramètres enregistrés avec succès. ») et les mêmes états
    chargement/erreur (avec bouton « Réessayer ») qu'au Jour 1 ;
  - l'email de notification vide est converti en `null` avant l'envoi (et non
    laissé en chaîne vide) : le schéma backend valide ce champ en
    `EmailStr | None`, et une chaîne vide n'est pas un email valide — sans
    cette conversion, un premier enregistrement sans email renseigné aurait
    échoué avec une erreur `422` peu claire pour l'utilisateur.
- Permissions inchangées : `isAdmin` continue de conditionner l'affichage du
  bouton d'enregistrement et l'état désactivé de tous les champs pour
  media_buyer/lecteur (lecture seule).
- Les onglets **Annonceurs** et **Utilisateurs** ne sont pas modifiés.

### Endpoints ajoutés (Jour 2)

| Méthode | URL | Description |
| --- | --- | --- |
| GET | `/api/account-settings` | **Nouveau.** Paramètres globaux du compte (`company_name`, `default_currency`, `timezone`, `language`, `notification_email`, `tracking_enabled`, `updated_at`). |
| PUT | `/api/account-settings` | **Nouveau.** Remplace entièrement les paramètres globaux (`company_name` obligatoire, 422 si absent). |
| PATCH | `/api/account-settings` | **Nouveau.** Met à jour partiellement les paramètres globaux (utilisé par l'onglet Paramètres). |

### Tests effectués

- `npm run build` ✅ et `npm run lint` ✅ (0 warning).
- Backend (curl) : `GET /api/account-settings` → 200 avec les 7 champs
  attendus ; `PATCH` partiel et `PUT` complet vérifiés (`PUT` sans
  `company_name` → 422) ; route confirmée dans `/api/openapi.json` sous le
  tag `account-settings` (visible dans Swagger `/docs`).
- Navigateur : l'onglet Paramètres affiche désormais les valeurs réellement
  renvoyées par `GET /api/account-settings` (plus aucune trace de
  « Marjane » / `contact@marjane.ma`) ; modification du nom d'entreprise →
  « Enregistrer les paramètres » → `PATCH /api/account-settings` → 200,
  message de succès affiché, valeur persistée (revérifiée par un `GET`
  direct) ; rechargement complet de la page sans erreur console.
- Onglets Annonceurs et Utilisateurs revérifiés inchangés après la
  correction.

### Limites actuelles (Jour 2)

- Toujours en mémoire uniquement (singleton `_GLOBAL_SETTINGS`, réinitialisé
  au redémarrage du backend), comme le reste de l'application à ce stade.
- Une seule ressource globale : pas de paramètres différenciés par annonceur
  pour le moment — l'endpoint imbriqué `/api/advertisers/{id}/settings` du
  Jour 1 reste disponible côté backend pour un usage futur, mais n'est plus
  relié à aucun écran.
