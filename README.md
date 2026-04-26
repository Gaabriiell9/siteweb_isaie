# Église Temple de la Célébration — Site Web

## 🐳 Lancer Supabase en local

Supabase self-hosted tourne entièrement dans Docker — aucun compte cloud nécessaire.

### Prérequis
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2

### 1. Démarrer tous les services

```bash
cd supabase-docker
docker compose up -d
```

Premier démarrage : ~2–3 minutes (téléchargement des images).

```bash
# Vérifier que tout est UP
docker compose ps
```

### 2. Vérifier l'API Gateway

```bash
curl http://localhost:8000/rest/v1/ \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.YJtPcwptZq-NGiwOvS-D8UBfvGO5-sAsrOHjPUG8YgQ"
# → doit retourner un JSON (liste de tables vide)
```

### 3. Accéder au Studio (Dashboard)

```
http://localhost:3000
```

> **⚠️ Conflit de port avec React**
> React (`npm start`) et Studio utilisent tous les deux le port **3000**.
> Vous ne pouvez pas les lancer simultanément.
>
> **Solution A** — Changer le port de Studio : dans `supabase-docker/docker-compose.yml`,
> remplacez `"3000:3000"` par `"3001:3000"` sous le service `studio`,
> puis accédez à Studio via `http://localhost:3001`.
>
> **Solution B** — Arrêter React avant d'ouvrir Studio, et vice-versa.

### 4. Créer le schéma de base de données

Dans Studio → **SQL Editor**, collez et exécutez le contenu du fichier
`supabase-schema.sql` situé à la racine du projet.

### 5. Connecter l'application React

Copiez `.env.local.example` en `.env.local` (déjà pré-rempli pour Docker local) :

```bash
cp .env.local.example .env.local
# REACT_APP_SUPABASE_URL=http://localhost:8000  ← déjà configuré
# REACT_APP_SUPABASE_ANON_KEY=eyJ...             ← déjà configuré
```

Puis lancez React (sur un terminal séparé, Studio étant arrêté ou sur port 3001) :

```bash
npm start  # → http://localhost:3000
```

### Services disponibles

| Service         | URL locale                    | Rôle                          |
|-----------------|-------------------------------|-------------------------------|
| API Gateway     | http://localhost:8000         | Point d'entrée de l'app React |
| Studio          | http://localhost:3000         | Dashboard admin Supabase      |
| Inbucket (mail) | http://localhost:9000         | Emails de dev (auth, invites) |
| PostgreSQL      | localhost:5432                | BDD directe (psql, DBeaver…)  |

### Arrêter les services

```bash
cd supabase-docker
docker compose down          # arrêt (données conservées)
docker compose down -v       # arrêt + suppression des volumes
```

---

## 🚀 Déploiement sur Vercel

### Prérequis
- Node.js 18+
- Compte Vercel (https://vercel.com)
- Git installé

### Étapes de déploiement

#### Option A — Via l'interface Vercel (recommandé)
1. Poussez ce dossier sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Init ETC church site"
   git remote add origin https://github.com/VOTRE-COMPTE/etc-church.git
   git push -u origin main
   ```
2. Allez sur https://vercel.com → "New Project"
3. Importez votre dépôt GitHub
4. Framework Preset : **Create React App**
5. Cliquez **Deploy** — c'est tout !

#### Option B — Via Vercel CLI
```bash
npm install -g vercel
cd etc-church
npm install
vercel --prod
```

---

## 🛠 Développement local
```bash
cd etc-church
npm install
npm start
# → http://localhost:3000
```

---

## ✏️ Personnalisations à faire

### Noms du couple pastoral
Ouvrez `src/pages/Pasteur.js` et remplacez :
```js
const PASTEUR_NOM = 'Pasteur — Nom à renseigner';
const PASTORALE_NOM = 'Pastorale — Nom à renseigner';
```

### Logo dans la navbar
Le logo E-T-C (cercle doré) peut être remplacé par l'image réelle.
Ouvrez `src/components/Navbar.js` et ajoutez :
```jsx
import logo from '../assets/logoe-eglise.png';
// Remplacez <div className="navbar-logo">E-T-C</div> par :
<img src={logo} alt="E-T-C" style={{ width: 40, height: 40, borderRadius: '50%' }} />
```

### Vidéos de prédication
Modifiez le tableau `VIDEOS` dans `src/pages/Predication.js`
avec les vraies URLs YouTube/Vimeo du service communication.

### Messages de la Montagne de Prière
Les messages quotidiens peuvent être chargés depuis une API
ou un CMS (Notion, Airtable, Contentful...) dans `src/pages/MontagnePriere.js`.

### Email de contact
Cherchez `contact@etc-church.org` et remplacez par l'email réel de l'église.

---

## 📁 Structure du projet
```
src/
├── assets/              ← Images (logo, couple)
├── components/
│   ├── Navbar.js / .css
│   ├── Footer.js
│   └── SectionHeader.js
├── pages/
│   ├── Home.js / .css
│   ├── Cultes.js / .css
│   ├── MontagnePriere.js / .css
│   ├── Predication.js / .css
│   ├── Cellule.js / .css
│   ├── Formation.js / .css
│   └── Pasteur.js / .css
├── App.js               ← Routage principal
└── index.css            ← Variables et styles globaux
```
