# Dexter

Dexter est un assistant de recherche basé sur l’intelligence artificielle. Il permet de poser des questions depuis une interface web, d’obtenir une réponse structurée en Markdown et, lorsque cela est utile, de consulter des sources provenant du web ou de Wikipédia.

Le projet est composé de deux parties :

- une API Python avec FastAPI, LangChain et OpenAI ;
- une interface web avec React et Vite.

## Fonctionnalités

- Conversation avec Dexter depuis une interface web responsive
- Réponses formatées en Markdown
- Recherche web avec DuckDuckGo
- Recherche encyclopédique avec Wikipédia
- Affichage des sources utilisées
- Enregistrement local de recherches dans `research_output.txt`
- Vérification de l’état de l’API
- Gestion des erreurs de connexion entre le frontend et le backend

## Technologies utilisées

### Backend

- Python
- FastAPI
- LangChain
- OpenAI
- Pydantic
- DuckDuckGo Search
- Wikipedia API

### Frontend

- React 19
- Vite
- Axios
- React Markdown
- Lucide React
- Tailwind CSS

## Structure du projet

```text
Dexter/
├── AI Agent/
│   ├── api.py
│   ├── main.py
│   ├── tools.py
│   ├── requirements.txt
│   └── research_output.txt
└── ai-agent-ui/
    ├── public/
    │   └── dexter.png
    ├── src/
    │   ├── App.jsx
    │   └── index.css
    ├── .env.example
    ├── package.json
    └── vite.config.js
```

## Installation

### 1. Cloner le projet

```bash
git clone <URL_DU_DEPOT>
cd Dexter
```

### 2. Configurer le backend

Depuis le dossier `AI Agent`, créez puis activez un environnement virtuel :

```powershell
cd "AI Agent"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Créez ensuite un fichier `.env` dans `AI Agent` :

```env
OPENAI_API_KEY=votre_cle_openai
```

Ne publiez jamais ce fichier ni votre clé API dans Git.

### 3. Configurer le frontend

Dans un autre terminal :

```powershell
cd ai-agent-ui
npm install
Copy-Item .env.example .env
```

La configuration par défaut du frontend est :

```env
VITE_API_URL=http://localhost:8000
```

## Lancer Dexter

### Démarrer l’API

Depuis le dossier `AI Agent` :

```powershell
.\venv\Scripts\python.exe -m uvicorn api:app --reload --port 8000
```

L’API sera disponible sur `http://localhost:8000`.

La documentation interactive de FastAPI sera disponible sur `http://localhost:8000/docs`.

### Démarrer l’interface

Depuis le dossier `ai-agent-ui` :

```powershell
npm run dev
```

Ouvrez ensuite l’adresse affichée par Vite, généralement `http://localhost:5173`.

## API

### Vérifier l’état du service

```http
GET /health
```

Exemple de réponse :

```json
{
  "status": "ok",
  "service": "Dexter"
}
```

### Envoyer une question

```http
POST /research
Content-Type: application/json
```

Corps de la requête :

```json
{
  "query": "Parle-moi de la bibliothèque turtle en Python."
}
```

Exemple de réponse :

```json
{
  "topic": "La bibliothèque turtle",
  "summary": "Réponse générée par Dexter...",
  "sources": [
    "https://docs.python.org/3/library/turtle.html"
  ],
  "tools_used": [
    "search"
  ]
}
```

## Scripts du frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

- `dev` lance le serveur de développement ;
- `build` crée la version de production ;
- `lint` analyse la qualité du code ;
- `preview` prévisualise le build de production.

## Logo

Le logo de Dexter se trouve dans `ai-agent-ui/public/dexter.png`. Il est accessible dans le frontend avec le chemin `/dexter.png`.

## Sécurité

- La clé OpenAI doit rester uniquement dans le backend.
- Les fichiers `.env` ne doivent jamais être envoyés sur Git.
- Le frontend ne doit contenir aucun secret.
- Avant une mise en production, configurez précisément les origines CORS autorisées et ajoutez une authentification à l’API.

## État du projet

Dexter est actuellement un projet personnel en développement. L’interface web et l’API communiquent correctement, mais des améliorations restent possibles, notamment la mémoire des conversations, l’authentification, les clés API personnelles, les quotas et le déploiement en production.
