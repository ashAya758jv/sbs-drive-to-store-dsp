# SBS Data Factory — Drive-to-Store DSP · Backend

API REST construite avec **FastAPI** pour la plateforme Drive-to-Store DSP.

Cette première version sert des **données mockées** (en mémoire), tout en étant
structurée pour basculer vers **PostgreSQL** (modèles SQLAlchemy déjà définis)
sans réécriture des routes.

## Stack

- **FastAPI** — framework API + documentation Swagger automatique
- **Uvicorn** — serveur ASGI
- **Pydantic v2** / **pydantic-settings** — schémas & configuration
- **SQLAlchemy 2** — ORM (prêt pour PostgreSQL)
- **psycopg2** — driver PostgreSQL (utilisé une fois la base branchée)

## Structure

```
backend/
├── app/
│   ├── main.py              # Application FastAPI (CORS, routes, /docs)
│   ├── database.py          # Engine/session SQLAlchemy (création paresseuse)
│   ├── core/
│   │   ├── config.py        # Paramètres (.env) via pydantic-settings
│   │   └── enums.py         # Énumérations (rôles, statuts, objectifs...)
│   ├── models/              # Modèles SQLAlchemy (User, Advertiser, Store,
│   │   │                    #   Campaign, Creative, Statistic)
│   ├── schemas/             # Schémas Pydantic (réponses API)
│   ├── routes/              # Endpoints REST
│   └── services/            # Accès aux données (mock aujourd'hui)
│       └── mock_data.py     # Jeu de données en mémoire
├── requirements.txt
├── .env.example
└── README.md
```

## Prérequis

- **Python 3.10+** (3.11 ou 3.12 recommandé) — `python --version`
- **pip**

> ℹ️ Python n'est pas encore installé sur cette machine. Sous Windows :
> `winget install Python.Python.3.12` (ou via https://www.python.org/downloads/),
> puis rouvrir le terminal.

## Installation & lancement

Toutes les commandes se lancent depuis le dossier `backend/`.

### Windows — PowerShell

```powershell
cd backend

# 1. Créer l'environnement virtuel
python -m venv .venv

# 2. L'activer
.\.venv\Scripts\Activate.ps1

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. (optionnel) Copier la config d'exemple
copy .env.example .env

# 5. Lancer le serveur de développement
uvicorn app.main:app --reload
```

### macOS / Linux — bash

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Le serveur démarre sur **http://127.0.0.1:8000**.

## Documentation interactive (Swagger)

- **Swagger UI** : http://127.0.0.1:8000/docs
- **ReDoc** : http://127.0.0.1:8000/redoc
- **Schéma OpenAPI** : http://127.0.0.1:8000/api/openapi.json

## Endpoints disponibles

| Méthode | URL                        | Description                                  |
| ------- | -------------------------- | -------------------------------------------- |
| GET     | `/api/health`              | État de santé de l'API                       |
| GET     | `/api/users`               | Liste des utilisateurs                       |
| GET     | `/api/advertisers`         | Liste des annonceurs                         |
| GET     | `/api/stores`              | Liste des magasins                           |
| GET     | `/api/campaigns`           | Liste des campagnes                          |
| GET     | `/api/statistics/dashboard`| KPIs + campagnes récentes + courbe de perf.  |

Exemple :

```bash
curl http://127.0.0.1:8000/api/health
# {"status":"ok","service":"SBS Data Factory — Drive-to-Store DSP API","version":"0.1.0"}
```

## Brancher PostgreSQL (étape suivante)

Les modèles SQLAlchemy sont prêts ; la base n'est volontairement pas connectée
au démarrage (l'engine est créé de façon paresseuse).

1. Démarrer un PostgreSQL et renseigner `DATABASE_URL` dans `.env`.
2. Créer les tables :

   ```bash
   python -c "from app.database import init_db; init_db()"
   ```

3. Remplacer progressivement les appels `services/*_service.py` (mock) par des
   requêtes utilisant la dépendance `get_db` de `app/database.py`.

## Lien avec le frontend

Le CORS autorise par défaut les serveurs de dev Vite
(`http://localhost:5173`, `http://localhost:5174`). Les données mockées du
backend sont alignées sur celles du frontend (annonceurs, campagnes,
dashboard), ce qui rendra le branchement React → API direct.

## État actuel

- [x] Structure FastAPI propre (core / models / schemas / routes / services)
- [x] Modèles de données principaux (SQLAlchemy, prêts pour PostgreSQL)
- [x] Schémas Pydantic pour les réponses
- [x] Endpoints REST sur données mockées
- [ ] Connexion PostgreSQL réelle
- [ ] Authentification / autorisation côté API
