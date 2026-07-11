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

## Jour 2 — Intégration complète et correction des bugs

> Cette journée couvre deux volets : (A) la correction du branchement de
> l'onglet Paramètres sur `/api/account-settings` (voir plus bas), et (B) une
> vérification bout en bout de tous les modules avec correction des bugs de
> navigation trouvés (section « Suite du Jour 2 » ci-dessous).

### A. Onglet Paramètres branché sur l'API globale `/api/account-settings`

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

---

### B. Suite du Jour 2 — Vérification bout en bout et correction des bugs de navigation

#### Objectif

Sur la branche `feat/week6-end-to-end-integration`, rejouer le parcours
complet de l'application (création de campagne, magasins, DCO, reporting,
gestion du compte, navigation globale) pour vérifier la cohérence entre
modules et corriger les bugs de navigation trouvés — sans refaire le design
ni casser les modules déjà validés.

#### Méthode

Backend et frontend relancés depuis zéro (cache Vite vidé) pour éliminer tout
état de serveur de dev périmé, puis parcours manuel dans le navigateur
(`mcp__Claude_Preview`) de chaque module avec vérification systématique de la
console (aucune erreur), des requêtes réseau (aucun échec) et du contenu
affiché :

- **Création de campagne** : `/campagnes` → `/campagnes/nouvelle` → remplissage
  de l'étape 1 → **« Enregistrer le brouillon »** (`POST /api/campaigns/drafts`
  → 201) → retour à `/campagnes` → le brouillon apparaît bien dans « Vos
  brouillons ». Parcours complet des 5 étapes (général → ciblage technique →
  formats → magasins ciblés → catégories) validé, y compris la règle du
  stepper (on ne peut sauter en avant qu'en validant chaque étape via
  « Suivant », comportement voulu, pas un bug).
- **Magasins** : import de `docs/samples/stores-valid.csv` → analyse (3
  lignes, 0 erreur) → « Tout sélectionner » → rayons de géociblage (5 km par
  défaut, éditables) → carte Leaflet avec les 3 marqueurs. Étape « Magasins
  ciblés » du wizard de création de campagne vérifiée identique (même
  composant partagé `StoreTargetingPanel`), confirmant la cohérence demandée.
- **DCO** : upload d'un visuel bannière → **« Enregistrer les créatives »**
  (`POST /api/dco/creatives` → 201) → **« Générer toutes les variantes »** →
  galerie et comparaison par magasin affichées → landing page prévisualisée →
  bouton **« Voir la fiche magasin »** confirmé sans navigation réelle
  (reste sur `/dco`, affiche l'encart « Lien magasin simulé pour la démo »).
- **Reporting** : changement du filtre Période (30 jours → 7 jours) → les 4
  KPI recalculés correctement (ex. impressions 1,6M → 366k) ; export CSV
  vérifié au niveau des octets (BOM `EF BB BF`, `sep=;`, accents normalisés) —
  déjà conforme, aucune régression.
- **Gestion du compte** : les 3 onglets rechargés sans erreur console ni
  requête en échec (déjà vérifiés en profondeur au Jour 1 / Jour 2-A).
- **Navigation globale** : route inconnue (`/route-inexistante-xyz`) →
  redirection vers `/dashboard` (pas de page blanche) ; breadcrumbs et
  sidebar revérifiés sur chaque page.

#### Bugs trouvés et corrigés

1. **Liens externes non maîtrisés vers des URLs mockées (404 potentiel)** —
   trois endroits affichaient un vrai lien cliquable (`<a href target="_blank">`)
   vers la valeur `store_url` des données de démo (ex.
   `https://www.marjane.ma/californie`), un domaine réel qui ne possède pas
   ces pages et renverrait une 404 :
   - `frontend/src/pages/DCO.jsx` (`VariantCard`, utilisé dans « Comparaison
     par magasin » et « Galerie des variantes ») ;
   - `frontend/src/components/stores/StoreTargetingPanel.jsx` (colonne URL du
     tableau des magasins importés, partagé par `/magasins` et l'étape
     « Magasins ciblés » du wizard) ;
   - `frontend/src/components/stores/StoreMap.jsx` (lien « Voir la fiche
     magasin → » dans le popup Leaflet, même deux écrans).

   **Correction** : dans les trois cas, remplacement du lien réel par un
   texte informationnel non cliquable (même position, même style visuel,
   URL toujours visible/consultable via `title`), sans navigation possible.
   Le bouton **« Voir la fiche magasin »** de la landing page DCO
   (`LandingPagePreview`) était déjà correctement traité depuis la Semaine 5
   Jour 3 (encart inline, pas de navigation) — non modifié ici.
2. **Lien « Voir tout » du Dashboard pointait vers le mauvais module** —
   dans la carte « Campagnes récentes » du Dashboard, le lien
   « Voir tout » renvoyait vers `/reporting` au lieu de `/campagnes`, ce qui
   ne correspondait pas au contenu de la section. Corrigé dans
   `frontend/src/pages/Dashboard.jsx` (`to="/campagnes"`).

Aucun autre bug de navigation, page blanche, route manquante ou bouton cassé
trouvé lors de ce parcours.

#### Fichiers modifiés (Jour 2-B)

- `frontend/src/pages/DCO.jsx`
- `frontend/src/components/stores/StoreTargetingPanel.jsx`
- `frontend/src/components/stores/StoreMap.jsx`
- `frontend/src/pages/Dashboard.jsx`

#### Tests effectués

- `npm run build` ✅ et `npm run lint` ✅ (0 warning).
- Vérification ciblée après correction : `document.querySelectorAll('a[href*="marjane"]')`
  renvoie 0 élément sur `/dco` et `/magasins` (plus aucun lien réel vers les
  URLs mockées), y compris dans le popup Leaflet (vérifié via son contenu
  HTML). Le lien « Voir tout » du Dashboard pointe bien vers `/campagnes`.
- Backend redémarré en fin de parcours pour repartir sur les données mockées
  d'origine (aucune donnée de test — brouillon, visuel DCO — laissée en
  mémoire).

#### Limites actuelles (Jour 2-B)

- Les URLs de magasin (`store_url`) restent des données de démonstration :
  elles sont maintenant affichées de façon purement informative partout
  (jamais cliquables), cohérent avec le choix déjà fait pour la landing page
  DCO en Semaine 5.
- Comme documenté aux jours précédents, l'ensemble de l'application reste sur
  des données mockées / en mémoire — aucune modification de ce périmètre
  n'a été faite ici.

---

### C. Neutralisation définitive des liens externes magasins

#### Contexte

Après la correction B ci-dessus, un test manuel sur `/dco` a signalé qu'une
URL magasin (ex. `https://www.marjane.ma/hay-riad`) dans la section
« Galerie des variantes » restait cliquable et menait à une page 404 réelle
sur marjane.ma. Vérification du code : la correction B avait bien remplacé
le `<a href>` par un `<span>` non cliquable dans les trois emplacements
identifiés — le comportement rapporté correspondait donc à un bundle
frontend obsolète (cache Vite / serveur de dev non redémarré), pas à un code
non corrigé.

#### Recherche exhaustive

Recherche de `store_url`, `storeUrl`, `href=`, `target="_blank"`,
`window.open`, « Voir la fiche magasin » et `marjane.ma` / `carrefour.ma`
dans tout `frontend/src`. Résultat : les trois emplacements de la correction
B (DCO, tableau magasins, popup carte) étaient déjà des `<span>` sans
`href`, plus le bouton « Voir la fiche magasin » de la landing page DCO
(toggle inline, pas de lien réel). Les seuls `<a href="http...">` restants
dans tout le code sont les liens d'attribution OpenStreetMap
(`https://www.openstreetmap.org/copyright`) dans `StoreMap.jsx` et
`ReportingZonesMap.jsx` — des liens réels, légitimes et obligatoires (mention
légale des fonds de carte), volontairement non modifiés.

#### Durcissement appliqué (par précaution, en plus de la vérification)

Pour éliminer tout doute (visuel et fonctionnel) et couvrir le cas d'un
bundle mis en cache côté navigateur/serveur de dev, les trois emplacements
ont été renforcés :
- `frontend/src/pages/DCO.jsx` (`VariantCard`, sections « Comparaison par
  magasin » et « Galerie des variantes ») ;
- `frontend/src/components/stores/StoreTargetingPanel.jsx` (colonne URL du
  tableau des magasins importés, `/magasins` + étape « Magasins ciblés » du
  wizard) ;
- `frontend/src/components/stores/StoreMap.jsx` (popup Leaflet, mêmes deux
  écrans).

Dans les trois cas : couleur neutralisée de `text-primary-700` (couleur des
liens) vers un gris neutre (`text-slate-500` / `#64748b`, identique aux
autres métadonnées comme les horaires) et `cursor: default` explicite, pour
qu'il n'y ait plus aucune ambiguïté visuelle laissant penser que ces textes
sont cliquables. Aucun `href`, `onClick` de navigation ni `window.open`
n'a jamais été présent après la correction B ; ce n'était qu'un
raffinement visuel de clarté, la case fonctionnelle était déjà cochée.

#### Tests effectués

- Backend et frontend **entièrement redémarrés** (cache `node_modules/.vite`
  vidé) pour exclure tout bundle périmé, puis :
  - `/dco` : upload + enregistrement d'un visuel → génération des variantes →
    dans « Galerie des variantes », l'élément affichant l'URL est vérifié
    par script être un `<span>` **sans attribut `href`**, avec
    `cursor: default`, et un clic dessus **ne modifie pas** `window.location`
    et n'appelle jamais `window.open` (vérifié en interceptant les deux).
  - `/magasins` : import CSV → sélection → même vérification sur la cellule
    URL du tableau (`<span>`, pas de `href`, clic sans navigation) et sur le
    popup Leaflet du marqueur (aucune balise `<a>` dans le popup, clic sur le
    texte de l'URL sans navigation).
  - Recherche finale `document.querySelectorAll('a')` filtrée sur
    `marjane.ma` / `carrefour.ma` sur les pages `/dco` et `/magasins` : **0
    résultat**.
- `npm run build` ✅ et `npm run lint` ✅ (0 warning).

#### Fichiers modifiés (Jour 2-C)

- `frontend/src/pages/DCO.jsx`
- `frontend/src/components/stores/StoreTargetingPanel.jsx`
- `frontend/src/components/stores/StoreMap.jsx`

#### Limites actuelles (Jour 2-C)

- Si un ancien onglet de navigateur reste ouvert sur une version pré-Jour 2
  de l'application (bundle Vite mis en cache avant ces corrections), un
  rechargement complet (Ctrl+F5) ou un redémarrage du serveur de dev est
  nécessaire pour voir le correctif — comportement normal de tout serveur de
  développement Vite, pas une limite du correctif lui-même.
- Aucune autre limite nouvelle : mêmes limites qu'aux sections A et B
  ci-dessus (données mockées / en mémoire).

---

### D. Composant `StoreUrlText` — URLs magasins en texte non cliquable (définitif)

#### Contexte

Malgré la correction C, un test manuel signalait encore des URLs magasins
cliquables sur `/dco` (« Comparaison par magasin » et « Galerie des
variantes »). Le code source ne contenait pourtant plus aucun `<a>`/`href`
autour d'un `store_url` — le symptôme correspond à un **bundle de dev en
cache** (Vite `node_modules/.vite` + onglet navigateur non rechargé). Pour
lever toute ambiguïté et centraliser la règle, un composant utilitaire dédié
a été introduit et branché partout où une URL magasin est affichée.

#### Composant utilitaire

Nouveau fichier `frontend/src/components/stores/StoreUrlText.jsx` : rend une
URL magasin comme **texte simple non cliquable** — un `<span>` sans `href`,
sans `onClick`, sans `target`, sans `window.open`. L'URL reste visible et
sélectionnable (`select-text`), en violet (`text-violet-600`), avec
`cursor: default` pour ne jamais ressembler à un lien. Retour explicite
« URL non disponible » quand `url` est vide.

```jsx
export default function StoreUrlText({ url, className }) {
  if (!url) return <span className={cn("text-slate-400", className)}>URL non disponible</span>;
  return (
    <span className={cn("cursor-default select-text text-violet-600", className)} title={url}>
      {url}
    </span>
  );
}
```

#### Emplacements branchés sur `StoreUrlText`

- `frontend/src/pages/DCO.jsx` :
  - `VariantCard` (utilisé par **« Comparaison par magasin »** ET
    **« Galerie des variantes »**) — l'URL passe désormais par
    `<StoreUrlText …>` (avant : `<span>` déjà non cliquable, mais couleur
    grise) ;
  - encart « Lien magasin simulé pour la démo » des **« Landing pages
    personnalisées »** — idem.
- `frontend/src/components/stores/StoreTargetingPanel.jsx` : colonne URL du
  tableau des magasins importés (`/magasins` **et** étape « Magasins ciblés »
  du wizard de création de campagne).
- `frontend/src/components/stores/StoreMap.jsx` : le popup Leaflet est
  construit en DOM impératif (pas de JSX), il ne peut donc pas réutiliser le
  composant React ; il applique la **même règle** manuellement (`<span>`,
  jamais `<a>`, couleur violet `#7c3aed`, `cursor: default`).

Le champ « URL du magasin » du bloc « Champs dynamiques client » de `/dco`
était déjà un `<input disabled readOnly>` (non navigable) — inchangé.
`Dashboard.jsx` n'affiche aucune URL magasin (seul lien : « Voir tout » →
`/campagnes`, lien interne React Router) — inchangé.

#### Vérification (preuve live, serveur relancé + cache Vite vidé)

- `/dco` (après upload → enregistrement → génération des variantes) : les
  **4** éléments affichant une URL magasin (2 dans « Comparaison par magasin »
  + 2 dans « Galerie des variantes ») sont tous `tagName === "SPAN"`,
  `hasAttribute("href") === false`, `closest("a") === null`,
  `cursor: default`, couleur violette. Un clic **sur chacun** :
  `window.location` inchangée (reste `/dco`) et `window.open` **jamais**
  appelé (les deux interceptés pendant le test).
- `/magasins` (import CSV → sélection) : la cellule URL du tableau est un
  `<span>` sans `href`, clic sans navigation ;
  `document.querySelectorAll('a')` filtré sur `marjane.ma` / `carrefour.ma`
  = **0** sur la page.
- Recherche code : plus **aucun** `<a>`/`href`/`target`/`window.open` autour
  d'un `store_url` dans tout `frontend/src`. Les seuls `<a href>` restants
  sont les attributions OpenStreetMap (mention légale des fonds de carte),
  légitimes.
- `npm run build` ✅ et `npm run lint` ✅ (0 warning). Le CSS généré passe de
  58,02 à 58,19 kB, confirmant que la classe `text-violet-600` est bien
  produite.

#### Fichiers modifiés (Jour 2-D)

- `frontend/src/components/stores/StoreUrlText.jsx` (**nouveau**)
- `frontend/src/pages/DCO.jsx`
- `frontend/src/components/stores/StoreTargetingPanel.jsx`
- `frontend/src/components/stores/StoreMap.jsx`

En résumé : **les URLs magasins sont désormais affichées en texte non
cliquable partout** (DCO, magasins, étape magasins du wizard, popup carte),
via le composant `StoreUrlText`. Aucune n'ouvre plus marjane.ma /
carrefour.ma.

---

## Jour 3 — Tests fonctionnels et corrections

> Passe de **validation fonctionnelle** de bout en bout de la Semaine 6
> (branche `test/week6-functional-validation`), sans nouvelle fonctionnalité,
> sans refonte visuelle et sans base de données réelle. Objectif : confirmer
> que le parcours complet reste cohérent et que les corrections des jours 1-2
> tiennent toujours. Tests menés dans le navigateur (frontend `:5173` +
> backend `:8000` réellement lancés).

### Éléments testés

**Authentification & navigation**
- Connexion (rôle Admin), déconnexion, persistance de session
  (`localStorage`).
- Garde de route : accès à `/reporting` sans session → redirection vers
  `/login` ✅.
- Les 7 routes principales atteignables et rendues correctement :
  `/dashboard`, `/campagnes`, `/campagnes/nouvelle`, `/magasins`, `/dco`,
  `/reporting`, `/compte`.
- Sidebar : l'élément actif est bien surligné sur chaque page ; fil d'Ariane
  (breadcrumb) et titre de page cohérents partout.
- Route inconnue (`/xyz-inexistant-123`) → redirection vers `/dashboard`
  (pas de page blanche) ✅.

**Parcours création de campagne (complet)**
- `/campagnes` → « Créer une campagne » → `/campagnes/nouvelle`.
- Étape 1 (infos générales) → 2 (ciblage : Mobile + Android) → 3 (formats) →
  4 (magasins : import CSV, analyse `POST /api/stores/import/preview` → 200,
  « Tout sélectionner » → 2 magasins) → 5 (catégories + **résumé**).
- Le **résumé** (« Résumé de la campagne ») affiche correctement toutes les
  données saisies, y compris « MAGASINS CIBLÉS (2) » avec ville et rayon par
  magasin — la sélection de magasins se propage bien jusqu'au résumé.
- « Enregistrer le brouillon » → `POST /api/campaigns/drafts` → 201, message
  « Brouillon enregistré. » → retour `/campagnes` → le brouillon apparaît
  dans « Vos brouillons » ✅.
- **Validation inter-étapes vérifiée** : « Créer la campagne » sans format
  sélectionné renvoie sur l'étape Formats avec le message « Veuillez corriger
  les champs signalés… » (la validation bloque bien) ✅.

**DCO**
- Upload d'un visuel → « Enregistrer les créatives » (`POST /api/dco/creatives`
  → 201) → « Générer toutes les variantes » → « Galerie des variantes (2) »,
  « Comparaison par magasin » et « Landing pages personnalisées » présentes.
- Prévisualisation d'une landing page + bouton « Voir la fiche magasin » :
  **aucune navigation externe**, `window.open` jamais appelé, l'encart
  « Lien magasin simulé pour la démo » s'affiche en interne ✅.

**Reporting**
- Filtre Période 30 j → 7 j : les 4 KPI se recalculent (ex. Impressions
  1,6M → 366k) ✅.
- Filtre Ville « Rabat » : le tableau se limite aux 2 magasins de Rabat ✅.
- Sections présentes : courbe « Évolution quotidienne », barres
  « Performance par… », carte des zones de diffusion, tableau triable.
- Export CSV vérifié au niveau des octets : BOM UTF-8 (`EF BB BF`), ligne
  `sep=;`, en-têtes et séparateur `;`, décimales à la virgule — lisible dans
  Excel FR ✅.

**Gestion du compte**
- Onglet **Annonceurs** : 4 lignes, recherche + filtre statut, fiche
  détaillée (secteur, adresse, ville, email, téléphone, site web), bouton
  « Modifier » (admin).
- **Modification** annonceur : changement du secteur → « Enregistrer »
  (`PATCH /api/advertisers/1`) → persistance confirmée côté backend, puis
  **valeur remise à l'origine** (aucune donnée de test laissée) ✅.
- Onglet **Utilisateurs** : 4 utilisateurs, bouton « Ajouter », filtre par
  rôle fonctionnel (rôle Admin → 1 ligne) ✅.
- Onglet **Paramètres** : charge bien les **paramètres globaux du compte**
  depuis `GET /api/account-settings` (company_name « SBS Data Factory », MAD,
  Africa/Casablanca, fr) — **pas** les données d'un annonceur (ex. Marjane) ;
  « Enregistrer les paramètres » (`PATCH /api/account-settings`) → message de
  succès ✅.

**Liens externes magasins (contrôle de non-régression Jour 2)**
- `/dco` (galerie + comparaison), `/magasins` (tableau) et l'étape magasins
  du wizard : `document.querySelectorAll('a')` filtré sur `marjane.ma` /
  `carrefour.ma` = **0 lien cliquable**, les URLs sont des `<span>` non
  cliquables. Aucune ouverture involontaire de marjane.ma / carrefour.ma ✅.

**Santé technique**
- `npm run lint` ✅ et `npm run build` ✅ (0 warning) en début de passe.
- **Zéro erreur console** et **zéro requête réseau en échec** sur l'ensemble
  du parcours.

### Bugs trouvés

- **Aucun bug fonctionnel** trouvé pendant cette passe. Les corrections des
  jours 1-2 (paramètres globaux du compte, neutralisation des liens externes
  magasins, lien « Voir tout » du Dashboard → `/campagnes`) sont toujours en
  place et opérationnelles.

### Corrections appliquées

- Aucune correction de code nécessaire : le parcours complet est cohérent et
  fonctionnel. Seul ce document a été mis à jour (ajout de la présente
  section Jour 3).

### Validations restantes

- Persistance réelle en base de données (PostgreSQL) — hors périmètre
  (données encore mockées / en mémoire, réinitialisées au redémarrage du
  backend), prévu pour une étape ultérieure.
- Tests d'accès en **lecture seule** approfondis pour les rôles
  `media_buyer` / `lecteur` (cette passe a été menée en rôle Admin ; le
  cloisonnement `isAdmin` avait déjà été validé au Jour 1).
- Envoi réel d'e-mails d'invitation / de notification (actuellement simulé).
- Tests automatisés (unitaires / e2e) — la validation reste manuelle à ce
  stade.

---

## Jour 4 — Documentation technique

> Passe de **documentation** (branche `docs/week6-technical-documentation`) :
> aucun code fonctionnel modifié, aucun design changé, aucune route ajoutée
> ou renommée. Objectif : donner à l'encadrante SBS une documentation
> technique complète et fiable de l'état actuel du projet, en s'appuyant
> uniquement sur le code existant.

### Travail réalisé

- Relecture complète du backend (`backend/app/routes/`, `schemas/`,
  `services/`, `models/`, `core/`, `database.py`, `main.py`) et du frontend
  (`frontend/src/routes/AppRouter.jsx`, `pages/`, `components/`, `data/`,
  `lib/api.js`) pour vérifier, endpoint par endpoint et route par route, ce
  qui existe réellement dans le code (aucun endpoint « imaginé »).
- Création de **`docs/documentation-technique.md`** — document de référence
  couvrant :
  1. l'architecture générale (frontend ↔ backend ↔ PostgreSQL non branché) ;
  2. la structure des dossiers frontend et backend, avec les conventions du
     projet (couche `data/*Api.js`, services `*_service.py`) ;
  3. le guide d'installation locale (Node.js / Python) ;
  4. les commandes de lancement backend (`uvicorn`) et frontend (`npm run dev`) ;
  5. les variables de configuration (`.env` backend, `VITE_API_URL` frontend) ;
  6. les 8 routes frontend principales, avec rôles autorisés et détail des 5
     étapes de l'assistant de création de campagne ;
  7. les **24 endpoints** backend actuellement enregistrés, avec méthode,
     rôle et exemple de réponse JSON réel (tiré des données mockées) ;
  8. un schéma logique condensé des entités (utilisateurs, annonceurs,
     campagnes, magasins, créatives, statistiques, paramètres de compte,
     brouillons de campagne), avec renvoi vers le schéma PostgreSQL complet
     déjà existant (`docs/schema-base-de-donnees.md`) ;
  9. un guide de test fonctionnel rapide (9 étapes, aligné sur le parcours
     déjà validé au Jour 3) ;
  10. les limites actuelles (données en mémoire, exception faite des
      brouillons de campagne réellement persistés ; deux registres de
      paramètres de compte distincts ; pas d'authentification réelle ; DCO
      et landing pages simulées ; pas de tests automatisés) ;
  11. des pistes de déploiement conceptuelles (frontend statique + backend
      ASGI + PostgreSQL), explicitement présentées comme non implémentées à
      ce jour (aucun Dockerfile ni pipeline CI/CD dans le dépôt).
- Mise à jour de ce fichier (`docs/etat-avancement-semaine-6.md`) avec la
  présente section.

### Points de vigilance documentés

- Les **paramètres de compte** existent sous **deux formes distinctes**
  côté backend : `/api/advertisers/{id}/settings` (par annonceur, Jour 1) et
  `/api/account-settings` (global, Jour 2) — la documentation technique
  précise explicitement laquelle est utilisée par l'écran actuel, pour
  éviter toute confusion lors d'une reprise du projet.
- Les **brouillons de campagne** sont la seule donnée réellement persistée
  aujourd'hui (PostgreSQL si disponible, sinon SQLite local
  `backend/.local/campaign_drafts.db`, ignoré par Git) — signalé comme
  exception au reste de l'API (mock en mémoire).
- Aucune fausse route ni faux endpoint n'a été documenté : la liste des 24
  endpoints correspond exactement à ce qui est enregistré dans
  `backend/app/routes/__init__.py` au moment de la rédaction.

### Fichiers modifiés / créés (Jour 4)

- `docs/documentation-technique.md` (**nouveau**)
- `docs/etat-avancement-semaine-6.md` (cette section)

### Validations restantes

- Tenir `docs/documentation-technique.md` à jour à chaque nouvel endpoint ou
  nouvelle route ajoutée dans les prochaines semaines.
- Aligner, à terme, `README.md` et `backend/README.md` (encore au niveau
  Semaine 2 pour le premier, liste d'endpoints partielle pour le second) sur
  le contenu de cette documentation technique.

---

## Jour 5 — Préparation de la démonstration finale

> Passe de **documentation uniquement** (branche `docs/week6-demo-preparation`) :
> aucun fichier de code frontend ou backend modifié, aucun comportement de
> l'application changé. Objectif : préparer un support complet pour la
> démonstration finale devant l'encadrante SBS, basé exclusivement sur les
> fonctionnalités réellement présentes dans le code (vérifiées par relecture
> du code et par recoupement avec `docs/documentation-technique.md`).

### Travail réalisé

- **Scénario de démo préparé** : création de
  `docs/scenario-demonstration-finale.md` — objectif de la démo, prérequis,
  commandes de lancement backend/frontend, parcours en 9 étapes (connexion →
  dashboard → gestion des campagnes → création de campagne → import/
  validation des magasins → DCO/variantes → reporting complet → gestion du
  compte → documentation technique/Swagger), avec pour chaque étape ce qu'il
  faut montrer, un texte oral court et les points techniques à mentionner,
  puis les limites actuelles du prototype et une conclusion.
- **Checklist de démo préparée** : création de
  `docs/checklist-demonstration-finale.md` — checklists avant / pendant /
  après la démo, tableau des erreurs possibles avec solution rapide (backend
  non lancé, frontend non lancé, port occupé, page blanche, cache
  navigateur, export CSV, erreur API), et un ordre recommandé de 12 captures
  d'écran pour préparer des slides.
- **Parcours de bout en bout prêt** : le scénario a été construit et
  recoupé avec le code réel (routes frontend `AppRouter.jsx`, endpoints
  backend `routes/__init__.py`), pas seulement avec la documentation déjà
  écrite, pour garantir qu'il correspond exactement à ce qui peut être
  montré en direct.
- **Aucun changement fonctionnel dans le code** : seuls des fichiers de
  documentation ont été créés/modifiés — vérifié avec `git status` en fin de
  tâche (voir « Fichiers modifiés / créés » ci-dessous).

### Vérifications d'honnêteté effectuées avant rédaction

Pour respecter la consigne de transparence, plusieurs affirmations ont été
vérifiées directement dans le code avant d'être inscrites dans le scénario :

- Confirmé par recherche dans `frontend/src` : la page `/campagnes` **n'appelle
  jamais** `GET /api/campaigns` — la section « Toutes les campagnes »
  affiche des données mockées côté frontend (`data/mockData.js`), seule la
  section « Vos brouillons » est réellement branchée à l'API
  (`GET/POST /api/campaigns/drafts`). Ce point est explicitement signalé
  dans le scénario plutôt que présenté comme entièrement dynamique.
- Reconfirmé que les brouillons de campagne restent la **seule donnée
  réellement persistée** (PostgreSQL ou repli SQLite local), tout le reste
  de l'API étant en mémoire et réinitialisé au redémarrage du backend.
- Correction d'une coquille héritée du Jour 4 dans ce même fichier
  (« la liste des 23 endpoints » → **24**, nombre réellement enregistré
  dans `backend/app/routes/__init__.py`).

### Fichiers modifiés / créés (Jour 5)

- `docs/scenario-demonstration-finale.md` (**nouveau**)
- `docs/checklist-demonstration-finale.md` (**nouveau**)
- `docs/etat-avancement-semaine-6.md` (cette section, + correction de la
  coquille « 23 » → « 24 » endpoints dans la section Jour 4)

### Validations restantes

- Répéter le scénario une fois en conditions réelles (backend + frontend
  fraîchement relancés) avant la démonstration officielle, pour valider les
  minutages et les textes oraux.
- Mettre à jour `docs/scenario-demonstration-finale.md` si de nouvelles
  fonctionnalités sont ajoutées avant la date de la démo.
