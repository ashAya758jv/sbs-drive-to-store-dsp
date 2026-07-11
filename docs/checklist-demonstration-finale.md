# Checklist — Démonstration finale Semaine 6

> À utiliser avec [`docs/scenario-demonstration-finale.md`](scenario-demonstration-finale.md).
> Objectif : que la démo se déroule sans surprise, et que les incidents
> courants (port occupé, page blanche, cache navigateur…) soient résolus en
> quelques secondes plutôt que de faire perdre du temps devant l'encadrante.

## Checklist avant la démo

- [ ] `git status` propre sur la branche de démo (aucun changement de code
      non intentionnel).
- [ ] Backend démarré **et redémarré juste avant la démo** (repart sur des
      données mockées propres, sans donnée de test résiduelle) :
      `cd backend && uvicorn app.main:app --reload`
- [ ] Vérification santé backend :
      `curl http://127.0.0.1:8000/api/health` → doit répondre `{"status":"ok",...}`
- [ ] Frontend démarré : `cd frontend && npm run dev`
- [ ] Application ouverte sur **http://localhost:5173** dans un onglet
      fraîchement rechargé (Ctrl+F5) ou en navigation privée.
- [ ] Swagger accessible dans un second onglet : **http://127.0.0.1:8000/docs**
- [ ] Fichier d'exemple prêt et localisé :
      `docs/samples/stores-valid.csv` (pour l'étape import magasins).
- [ ] Une image de test légère (PNG/JPG/WEBP, < 5 Mo) prête pour l'étape DCO
      si `stores-valid.csv` ne suffit pas à illustrer un vrai visuel.
- [ ] Connexion internet active (les cartes utilisent des tuiles
      OpenStreetMap chargées en ligne — `/magasins`, `/dco` implicitement
      via les magasins, `/reporting`).
- [ ] Résolution d'écran / partage d'écran testés (menus latéraux et
      tableaux larges doivent rester lisibles).
- [ ] Onglets navigateur inutiles fermés pour éviter toute distraction ou
      fuite d'information (autres projets, messagerie…).
- [ ] Relire une dernière fois le scénario
      [`scenario-demonstration-finale.md`](scenario-demonstration-finale.md)
      pour se remémorer l'ordre et les textes oraux.

## Checklist pendant la démo

- [ ] Suivre l'ordre du scénario (connexion → dashboard → campagnes →
      création → magasins → DCO → reporting → compte → Swagger) sans sauter
      d'étape, pour garder un fil narratif cohérent.
- [ ] Se connecter en rôle **Admin** en premier (accès complet à tous les
      modules) ; changer de rôle uniquement si l'encadrante demande à voir
      la différence d'accès (Media buyer / Lecteur).
- [ ] Garder la console navigateur fermée pendant la démo (F12), mais savoir
      l'ouvrir rapidement si une erreur inattendue apparaît à l'écran.
- [ ] Si un appel API échoue pendant la démo (bandeau d'erreur, message
      « API injoignable ») : rester calme, plusieurs écrans ont un mode
      dégradé (ex. brouillon de campagne sauvegardé localement même si le
      backend est injoignable) — voir la section erreurs ci-dessous.
- [ ] Ne pas s'attarder sur un détail visuel mineur ; revenir au fil du
      scénario si une question fait dévier la démo.
- [ ] Mentionner explicitement les limites au moment approprié (données
      mockées, PostgreSQL non branché, landing pages simulées) plutôt que
      d'attendre une question — cela renforce la crédibilité plutôt que de
      la fragiliser.
- [ ] Terminer par Swagger et la documentation technique, qui montrent que
      le travail est structuré au-delà de l'écran visible.

## Checklist après la démo

- [ ] Noter les retours / questions de l'encadrante (fonctionnalités
      demandées, points à clarifier) dans un futur fichier d'avancement.
- [ ] Ne **pas** committer ni pousser de changement effectué à chaud
      pendant la démo sans relecture.
- [ ] Si des données de test ont été créées pendant la démo (utilisateur,
      annonceur modifié, brouillon de campagne…), redémarrer le backend
      pour repartir sur un état propre avant la prochaine session de travail.
- [ ] Arrêter proprement les serveurs si la machine n'est plus utilisée
      (`Ctrl+C` dans chaque terminal).
- [ ] Vérifier `git status` une dernière fois : aucun fichier de code ne
      doit avoir été modifié pendant la préparation ou la démo elle-même.

---

## Erreurs possibles et solution rapide

| Problème | Symptôme | Solution rapide |
| --- | --- | --- |
| **Backend non lancé** | La page se charge mais les tableaux restent vides ou affichent une erreur réseau ; message « API injoignable — lancez le backend… » sur certains écrans | `cd backend`, activer le venv, puis `uvicorn app.main:app --reload`. Vérifier avec `curl http://127.0.0.1:8000/api/health`. |
| **Frontend non lancé** | Le navigateur affiche « Cette page est inaccessible » sur `localhost:5173` | `cd frontend && npm run dev`, attendre le message « Local: http://localhost:5173 » avant de rafraîchir le navigateur. |
| **Port occupé** (8000 ou 5173 déjà utilisé par un ancien processus) | Le serveur refuse de démarrer / message « port already in use » | Identifier puis arrêter l'ancien processus : Windows `netstat -ano \| findstr :8000` (ou `:5173`) puis `taskkill /PID <pid> /F` ; macOS/Linux `lsof -i :8000` puis `kill -9 <pid>`. Relancer ensuite normalement. |
| **Page blanche** | L'application ne s'affiche pas du tout, écran vide | Généralement un bundle Vite obsolète après un changement récent : arrêter le serveur frontend, supprimer le dossier `frontend/node_modules/.vite`, relancer `npm run dev`, puis recharger le navigateur en forçant (Ctrl+F5). Vérifier aussi la console (F12) pour une erreur JavaScript explicite. |
| **Problème de cache navigateur** | Une correction récente ne semble « pas appliquée », comportement d'une ancienne version visible | Recharger en forçant le cache (Ctrl+F5 / Cmd+Shift+R), ou ouvrir l'application dans une fenêtre de navigation privée. |
| **Problème d'export CSV** (accents illisibles, colonnes mal séparées dans Excel) | Caractères bizarres à l'ouverture, ou tout le contenu dans une seule colonne | Le fichier exporté contient déjà un BOM UTF-8 et utilise `;` comme séparateur pour Excel FR. Si le problème persiste : réessayer l'export (retélécharger), ou ouvrir via *Données > À partir d'un fichier texte/CSV* dans Excel plutôt que par double-clic. |
| **Erreur API inattendue** (404, 422, 500) pendant une action | Message d'erreur affiché dans l'interface après un clic (ex. enregistrement d'un formulaire) | Reproduire l'appel directement dans Swagger (`http://127.0.0.1:8000/docs`) pour voir le message d'erreur exact renvoyé par le backend ; vérifier que le backend a bien redémarré après une modification récente ; consulter la console navigateur (F12 → Console/Network) pour le détail de la requête en échec. |

---

## Ordre recommandé des captures d'écran (pour préparer des slides)

1. Écran de connexion (`/login`)
2. Dashboard — KPI + graphique + campagnes récentes (`/dashboard`)
3. Liste des campagnes avec un brouillon visible (`/campagnes`)
4. Assistant de création de campagne — une étape clé (ex. résumé final,
   étape 5) (`/campagnes/nouvelle`)
5. Import et sélection des magasins + carte avec rayons de geofencing
   (`/magasins` ou étape 4 de l'assistant)
6. DCO — upload de visuel et galerie des variantes générées (`/dco`)
7. DCO — landing page personnalisée simulée pour un magasin (`/dco`)
8. Reporting — KPI et graphiques (`/reporting`)
9. Reporting — carte des zones de diffusion et tableau par magasin
   (`/reporting`)
10. Gestion du compte — fiche détaillée d'un annonceur (`/compte`, onglet
    Annonceurs)
11. Gestion du compte — paramètres avec message de succès après
    enregistrement (`/compte`, onglet Paramètres)
12. Swagger UI — liste des endpoints (`http://127.0.0.1:8000/docs`)

Cet ordre suit exactement le déroulé du scénario de démonstration, pour que
les slides puissent servir de support visuel sans travail de réorganisation
supplémentaire.
