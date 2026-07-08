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

---

## Jour 2 — Génération automatique des variantes DCO

### Objectif

À partir des visuels déjà **enregistrés** (Jour 1) et des magasins de
l'annonceur sélectionné, générer automatiquement toutes les combinaisons
« visuel × magasin » (les **variantes**), avec injection des champs
dynamiques du magasin (nom, ville, adresse, horaires, URL), et permettre de
les prévisualiser (comparaison par magasin + galerie complète).

### Génération automatique des variantes

- Nouveau bouton **« Générer toutes les variantes »** sur la page `/dco`.
- Au clic, une variante est créée pour **chaque visuel enregistré** (statut
  « Enregistré », un par format : bannière, pavé, interstitiel) **×** **chaque
  magasin** de l'annonceur sélectionné (`GET /api/stores`, déjà utilisé pour
  les champs dynamiques du Jour 1). Chaque variante embarque le format, le
  visuel (aperçu local) et les champs dynamiques du magasin correspondant
  (nom, ville, adresse, horaires, URL).
- Le calcul est un simple produit cartésien effectué **côté frontend** — voir
  « Choix technique » ci-dessous pour la justification.

### Aperçu par magasin (comparaison)

- Section **« Comparaison par magasin »** : deux sélecteurs (« Magasin A » /
  « Magasin B ») pré-remplis avec les deux premiers magasins distincts parmi
  les variantes générées, permettant de comparer côte à côte le rendu des
  créatives pour **deux magasins différents** de l'annonceur.
- Si l'annonceur n'a qu'un seul magasin, un message explique que la
  comparaison nécessite au moins deux magasins.

### Galerie des variantes

- Section **« Galerie des variantes (N) »** listant toutes les combinaisons
  générées. Chaque carte affiche : le **format** (badge), la **ville**,
  l'**image** du visuel, le **nom du magasin**, et les **champs dynamiques**
  appliqués (adresse, horaires, lien vers la fiche magasin).

### État de validation (UX)

- Le bouton de génération est **désactivé** tant qu'aucun visuel n'est
  enregistré, avec un message explicite
  (« Enregistrez au moins un visuel ci-dessus... »).
- Il est également désactivé si **aucun magasin n'est disponible** pour
  l'annonceur sélectionné, avec un message dédié
  (« Aucun magasin disponible pour cet annonceur... »).
- Quand la génération est possible, un texte d'aide affiche le calcul en
  direct (ex. *"2 visuels × 2 magasins = 4 variantes seront générées."*).
- Un **message de succès** confirme le nombre de variantes générées après le
  clic.
- **Changer d'annonceur réinitialise** les visuels enregistrés et les
  variantes générées (évite de mélanger les données de deux annonceurs
  différents — voir « Bug corrigé » ci-dessous).
- Si un visuel est remplacé/retiré après génération, les variantes qui
  utilisaient son aperçu sont automatiquement retirées de la galerie (pas
  d'image cassée).

### Choix technique : génération 100 % frontend, pas de nouvel endpoint

Les endpoints existants (`GET /api/stores`, `GET/POST /api/dco/creatives`)
suffisent pour construire les variantes : le backend ne stocke **aucun octet
d'image** (Jour 1, volontairement — seules les métadonnées sont enregistrées
en mémoire). L'aperçu visuel d'une variante ne peut donc de toute façon
provenir que de l'aperçu local (`URL.createObjectURL`) du fichier tel qu'il a
été enregistré dans la session en cours. Ajouter un endpoint backend
« génération » n'aurait pas pu renvoyer de vraie image et aurait dupliqué une
logique déjà réalisable avec les données déjà disponibles côté client : le
produit cartésien visuel × magasin est donc calculé **entièrement côté
frontend**, sans appel réseau supplémentaire ni nouvel endpoint. **Aucun
fichier backend n'a été modifié pour le Jour 2.**

### Bug corrigé pendant les tests

En testant le changement d'annonceur *après* avoir enregistré des visuels, un
défaut a été identifié : les visuels enregistrés pour un annonceur restaient
« actifs » après passage à un autre annonceur, permettant de générer des
variantes mélangeant le visuel d'un annonceur avec les magasins d'un autre.
Corrigé en réinitialisant les zones d'upload (et les variantes) à chaque
changement d'annonceur.

### Tests effectués

- `npm run build` ✅ et `npm run lint` ✅ (0 warning).
- Navigateur (parcours complet, annonceur Marjane — 2 magasins) : upload
  bannière + pavé → enregistrement (`POST /api/dco/creatives` × 2) → bouton
  génération activé avec le bon calcul (« 2 visuels × 2 magasins = 4
  variantes ») → génération → 4 variantes exactes (bannière/pavé ×
  Californie/Hay Riad), chacune avec les bons champs dynamiques → section
  comparaison avec 2 magasins différents pré-sélectionnés → galerie complète.
- Changement d'annonceur (Marjane → Carrefour, 1 seul magasin) : variantes et
  visuels enregistrés réinitialisés, bouton de génération redevient désactivé
  avec le bon message.
- Dashboard, Campagnes, Magasins vérifiés inchangés après ces ajouts.

### Ce qui est fait / ce qu'il reste à faire

**Fait (Jour 2)**
- Génération automatique des variantes (visuel × magasin) avec champs
  dynamiques injectés.
- Comparaison côte à côte de deux magasins.
- Galerie complète des variantes générées.
- États de validation (bouton désactivé, messages clairs, succès).

**Reste à faire (prochains jours)**
- Rattacher les variantes générées à une **campagne** précise (brouillon).
- Persistance des variantes générées côté backend (actuellement recalculées à
  chaque clic, non sauvegardées).
- Bloc Reporting (Jour 3+ de la Semaine 5).

### Limites actuelles (Jour 2)

- Les variantes générées **ne sont pas persistées** : elles disparaissent au
  rechargement de la page (recalcul à la demande).
- La génération reste limitée aux magasins de l'annonceur **actuellement
  sélectionné** dans la page DCO (cohérent avec le modèle de données :
  visuel et magasin partagent le même `advertiser_id`).
- Pas de pagination de la galerie : au-delà de quelques dizaines de
  combinaisons (beaucoup de magasins × formats), l'affichage restera
  fonctionnel mais pourra être densifié plus tard.

---

## Jour 3 — Landing page personnalisée par magasin (bloc 4.2)

### Objectif

Simuler, pour chaque magasin ayant au moins une variante générée (Jour 2),
une **landing page personnalisée** combinant son visuel publicitaire et ses
champs dynamiques (nom, ville, adresse, horaires, URL), avec une
prévisualisation directement dans la page `/dco` (pas de nouvelle route
publique pour l'instant).

### Génération automatique par magasin

- Une landing page est disponible pour **chaque magasin ayant au moins une
  variante générée** (réutilise directement `variants`, produit du Jour 2 —
  aucun nouvel appel réseau, aucune nouvelle dépendance backend).
- Le **visuel** de la landing page est, par défaut, la **première variante
  disponible** pour ce magasin ; si plusieurs formats ont été générés pour ce
  magasin (ex. bannière **et** interstitiel), une rangée de **pastilles de
  sélection** permet de choisir explicitement le visuel à afficher
  (« Visuel affiché : Bannière / Interstitiel »).
- Les champs dynamiques injectés sont exactement ceux du magasin : nom,
  ville, adresse, horaires, URL.

### Les 3 blocs de la landing page

1. **Bloc visuel principal** — image publicitaire (aperçu local du visuel
   choisi) avec un badge du format et le **nom du magasin** en superposition.
2. **Bloc carte/localisation** — icône de localisation, **adresse** et
   **ville**, plus une **indication de proximité simulée** (« À environ X km
   de votre position (estimation indicative) », valeur illustrative
   déterministe par magasin — aucune géolocalisation réelle n'est utilisée,
   conformément à la consigne « pas besoin de vraie IA »).
3. **Bloc horaires/contact** — les **horaires** d'ouverture et un bouton
   **« Voir la fiche magasin »**. Ce bouton **ne navigue pas** vers l'URL
   réelle du magasin (voir « Correctif » ci-dessous) : il affiche un message
   inline « Lien magasin simulé pour la démo : *URL* » directement sous le
   bouton, sans quitter la page.

Une petite barre de navigateur factice (points de couleur + URL simulée
`landing.sbs-dsp.ma/<slug-du-magasin>`) donne un rendu proche d'une vraie page
web, sans qu'aucune route publique ne soit réellement créée.

### Sélecteur et bouton de prévisualisation

- **Sélecteur « Magasin à prévisualiser »** (menu déroulant listant tous les
  magasins ayant une landing page disponible).
- Bouton **« Prévisualiser la landing page »** : ouvre l'aperçu **dans la même
  page** (pas de navigation, pas de nouvel onglet) pour le magasin
  actuellement sélectionné.
- Choisir un autre magasin dans le sélecteur met à jour le contenu si
  l'aperçu est déjà ouvert.

### Galerie / listing des landing pages générées

- Section **« Toutes les landing pages générées (N) »** : une carte compacte
  par magasin (miniature du visuel, nom, ville) avec son propre bouton
  **« Prévisualiser la landing page »**, qui ouvre directement l'aperçu
  détaillé pour ce magasin. Complète le sélecteur du dessus par un accès plus
  visuel/parcourable.

### État de validation (UX)

- Si aucune variante n'a encore été générée, un message clair invite à
  générer les variantes d'abord (« Générez d'abord les variantes... »),
  cohérent avec le message équivalent du Jour 2.
- Changer d'annonceur réinitialise la prévisualisation (magasin, visuel
  choisi, aperçu ouvert/fermé), pour rester cohérent avec la remise à zéro
  déjà appliquée aux visuels et aux variantes.
- Régénérer les variantes referme l'aperçu ouvert (évite de référencer un
  visuel qui vient d'être remplacé) et re-sélectionne le premier magasin
  disponible par défaut.

### Choix technique : aucune modification backend

Comme pour le Jour 2, la génération de landing pages ne fait que combiner des
données déjà disponibles côté frontend (`variants`, lui-même dérivé de
`GET /api/stores` et des visuels déjà enregistrés) : aucun fichier backend
n'a été modifié pour le Jour 3.

### Correctif : bouton « Voir la fiche magasin » simulé (évite les 404 en démo)

Les `store_url` viennent des données de test (ex. `marjane.ma/californie`) et
ne correspondent pas à de vraies pages en ligne : cliquer dessus pouvait faire
quitter l'application vers une page **404**, ce qui est trompeur pendant une
démo. Le bouton **ne navigue plus jamais** hors de l'application :

- Au clic, il affiche/masque (bascule) un encart discret directement sous le
  bouton, dans la même carte : **« Lien magasin simulé pour la démo : *URL*
  »** — l'URL est visible mais **aucune navigation automatique** n'est
  déclenchée.
- Le bouton reste **visible et actif** (il représente bien la fonctionnalité
  attendue), seul son comportement au clic a changé.
- L'encart se réinitialise proprement quand on change de magasin prévisualisé
  (aucun message obsolète affiché pour le mauvais magasin).
- Design cohérent : encart violet clair (`bg-primary-50/60`), même famille de
  couleurs que le reste de la landing page simulée.

### Tests effectués

- `npm run build` ✅ et `npm run lint` ✅ (0 warning).
- Navigateur (annonceur Marjane, 2 magasins) : après génération des variantes,
  la section « Landing pages personnalisées » affiche le sélecteur, le bouton
  de prévisualisation, les pastilles de visuel (Bannière/Interstitiel) et la
  galerie (2 cartes).
- Clic sur « Prévisualiser la landing page » → les 3 blocs s'affichent avec
  les bonnes données (nom, adresse, ville, horaires, bouton « Voir la fiche
  magasin »).
- Changement de magasin via la galerie (Californie → Hay Riad) → contenu mis
  à jour correctement (adresse, ville, distance simulée différente : 8 km vs
  3 km), confirmant que chaque magasin a bien sa propre landing page.
- Clic sur « Voir la fiche magasin » → message « Lien magasin simulé pour la
  démo : https://www.marjane.ma/californie » affiché **sans navigation**
  (l'URL de la page reste `/dco`) ; re-clic → message masqué (bascule) ;
  changement de magasin → message correctement réinitialisé.
- Dashboard, Campagnes, Magasins, création de campagne vérifiés inchangés.

### Ce qui est fait / ce qu'il reste à faire

**Fait (Jour 3)**
- Génération automatique d'une landing page simulée par magasin.
- Les 3 blocs requis (visuel, localisation, horaires/contact).
- Sélecteur de magasin + bouton de prévisualisation inline.
- Galerie/listing de toutes les landing pages générées.

**Reste à faire (prochains jours)**
- Vraie route publique par landing page (actuellement prévisualisation
  intra-page uniquement, par choix explicite du Jour 3).
- Géolocalisation réelle pour l'indication de proximité (actuellement
  simulée).
- Persistance des landing pages générées côté backend.

### Limites actuelles (Jour 3)

- L'indication de proximité est **entièrement simulée** (valeur déterministe
  par identifiant de magasin), clairement libellée « estimation indicative »
  pour éviter toute confusion avec une vraie géolocalisation.
- Aucune landing page n'est **persistée** : tout est recalculé à la demande
  à partir des variantes actuellement en mémoire.
- Pas de vraie URL publique : la barre d'adresse affichée est un habillage
  visuel, pas un lien fonctionnel.

---

## Jour 4 — Écran Reporting (KPI + graphiques)

### Objectif

Remplacer le placeholder de la page **Reporting** par un vrai tableau de bord
de reporting : indicateurs clés, courbe d'évolution quotidienne, comparaison
par campagne/ville et synthèse textuelle automatique, filtrable par période,
campagne et ville/magasin.

### Fonctionnalités réalisées

**Filtres (en haut de page, dans le `PageHeader`)**
- **Période** : « 7 derniers jours » / « 30 derniers jours » / « Ce mois »
  (mois calendaire en cours, du 1ᵉʳ jour à aujourd'hui).
- **Campagne** : « Toutes les campagnes » + les 4 campagnes déjà connues de
  l'application (mêmes noms que sur le Dashboard).
- **Ville / magasin** : « Toutes les villes » + la liste réelle des villes
  issues de `GET /api/stores` (endpoint déjà existant, réutilisé tel quel —
  aucune modification backend), avec repli sur une liste statique
  (Casablanca, Rabat, Fès) si l'API est injoignable.

**4 cartes KPI** (même style que le Dashboard : icône violette, badge de
variation vert/rouge) — **Impressions**, **Clics**, **CTR**, **Budget
dépensé** — chacune avec sa variation en pourcentage par rapport à la période
comparable précédente (ex. 30 derniers jours vs les 30 jours d'avant).

**Graphique en courbe** — évolution quotidienne des impressions (axe gauche)
et des clics (axe droit) sur la période filtrée, même langage visuel que le
graphique du Dashboard (tooltip personnalisé, couleurs de la charte).

**Graphique en barres, adaptatif** :
- Si « Toutes les campagnes » est sélectionné → compare les **campagnes**
  entre elles (impressions + clics).
- Si une **campagne précise** est sélectionnée → bascule automatiquement sur
  une comparaison **par ville/magasin** de cette campagne (comparer une
  campagne à elle-même n'aurait pas de sens) — le titre du bloc s'adapte en
  conséquence.

**Bloc de synthèse textuelle** (« Principaux enseignements ») : 3 à 4 phrases
générées à partir des données déjà calculées (pas de texte inventé) :
variation des impressions vs période précédente, CTR moyen et budget
dépensé, campagne la plus performante (masqué si une seule campagne est déjà
filtrée, car redondant), ville générant le plus de clics.

### Données mockées

Nouveau fichier `frontend/src/data/reportingData.js` : génère, une seule fois
au chargement du module, **90 jours** de données quotidiennes par campagne et
par ville (impressions, clics, dépense), avec un générateur pseudo-aléatoire
**déterministe** (les chiffres restent stables tant que la page n'est pas
totalement rechargée) ancré sur la **vraie date du jour** — les filtres « 7 /
30 derniers jours » et « Ce mois » restent donc pertinents à n'importe quel
moment futur, sans données qui deviennent obsolètes. Les villes par campagne
reprennent exactement la répartition des magasins mockés du backend (Marjane
→ Casablanca + Rabat, Carrefour/BIM → Casablanca, CIH → Rabat).

### Recharts

**Déjà installé** (`recharts` `^3.9.0` dans `package.json`) — **aucune
nouvelle dépendance ajoutée**. Deux nouveaux composants de graphique,
`frontend/src/components/charts/ReportingTrendChart.jsx` et
`ReportingBarChart.jsx`, ajoutés à côté du `PerformanceChart.jsx` existant
plutôt que de le modifier, pour garantir que le Dashboard n'est jamais
touché.

### Choix technique : aucune modification des fichiers partagés

- `Dashboard.jsx`, `PerformanceChart.jsx` et `mockData.js` n'ont **pas été
  modifiés**. Le composant `KpiCard` et la logique de filtre sont dupliqués
  localement dans `Reporting.jsx` (comme les sous-composants de `DCO.jsx`),
  pour éliminer tout risque de régression sur le Dashboard.
- Seul appel réseau : `GET /api/stores` (déjà utilisé par `/magasins` et
  `/dco`), en lecture seule, avec repli local si indisponible.

### Tests effectués

- `npm run build` ✅ et `npm run lint` ✅ (0 warning).
- Navigateur : les 4 KPI, la courbe, le graphique en barres et la synthèse
  s'affichent avec des données cohérentes (ex. 1,6M impressions / 14 495
  clics / 0,90 % CTR / 30 606 MAD sur 30 jours, toutes campagnes confondues).
- Sélection d'une campagne unique (Marjane Ramadan 2026) → le graphique en
  barres bascule sur « Performance par ville / magasin » (Casablanca / Rabat)
  et l'enseignement « campagne la plus performante » disparaît (redondant).
- Filtre Ville/magasin alimenté par les vraies données de `GET /api/stores`.
- Dashboard, Campagnes, Magasins, Créations/DCO, création de campagne
  vérifiés inchangés après ces ajouts.

### Ce qui est fait / ce qu'il reste à faire

**Fait (Jour 4)**
- Dashboard reporting complet : 4 KPI, courbe quotidienne, barres
  comparatives adaptatives, synthèse textuelle.
- Filtres période / campagne / ville-magasin.
- Données mockées réalistes, ancrées sur la date réelle.

**Reste à faire (Jour 5, cf. instructions)**
- Export CSV des données de reporting.
- Carte géographique de reporting (visites par magasin).

### Limites actuelles (Jour 4)

- Les données sont **entièrement mockées** (générées côté frontend, aucune
  connexion à une vraie base de données ou aux statistiques réelles des
  campagnes).
- Le filtre Ville/magasin ne permet pas encore de sélectionner un **magasin
  précis** (seulement sa ville) — un filtre plus granulaire pourra être
  ajouté plus tard si nécessaire.
- Pas d'export ni de carte géographique à ce stade (prévus Jour 5).
