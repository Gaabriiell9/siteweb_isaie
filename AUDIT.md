# AUDIT COMPLET : Site Web Temple de la Célébration

**Date :** 2026-09-18  
**Auditeur :** Claude (audit de code automatisé)  
**Projet :** siteweb_isaie  
**Déploiement :** siteweb-isaie.vercel.app  
**Stack :** React 18 (CRA), react-router-dom v6, Supabase (PostgreSQL + Auth), Vercel

---

## 1. Résumé exécutif

### Avancement global estimé : **75%**

| Module | Avancement | Commentaire |
|--------|------------|-------------|
| Site public (pages) | 95% | Toutes les pages sont fonctionnelles |
| Panneau admin | 85% | CRUD complet, quelques manques (voir ci-dessous) |
| Espace élève | 80% | Fonctionnel, paiement Stripe non intégré |
| Base de données / RLS | 70% | Fichiers SQL partiels, RLS à compléter |
| Sécurité | 65% | Protection admin côté client seulement |
| Stripe / Paiements | 5% | Stubs uniquement, non fonctionnel |

---

## 2. Cartographie du projet

### 2.1 Arborescence commentée

```
siteweb_isaie/
├── public/
│   └── index.html              # HTML racine avec SEO/OG tags
├── src/
│   ├── App.js                  # Routeur principal (react-router-dom v6)
│   ├── index.js                # Point d'entrée React
│   ├── index.css               # Styles globaux et variables CSS
│   ├── assets/                 # Images (logo, photos)
│   ├── components/
│   │   ├── Footer.js           # Footer avec réseaux sociaux (liens placeholder)
│   │   ├── Navbar.js           # Navigation publique
│   │   ├── Navbar.css
│   │   ├── Icon.js             # Composant icônes SVG
│   │   ├── ProtectedRoute.js   # Protection routes élève (session Supabase)
│   │   └── SectionHeader.js    # En-tête de section réutilisable
│   ├── lib/
│   │   ├── supabase.js         # Client Supabase + tous les helpers (1237 lignes)
│   │   ├── stripe.js           # STUBS Stripe (non fonctionnel)
│   │   ├── dateUtils.js        # Calcul état événements (a_venir/en_cours/termine)
│   │   ├── mockData.js         # Données fictives mode hors-ligne
│   │   ├── videoUtils.js       # Utilitaires vidéo
│   │   └── youtube.js          # Extraction ID YouTube
│   └── pages/
│       ├── Home.js/css         # Page d'accueil
│       ├── Cultes.js/css       # Programme cultes + replay
│       ├── MontagnePriere.js/css  # Messages prière 12 familles
│       ├── Predication.js/css  # Chaîne vidéos YouTube
│       ├── Cellule.js/css      # Cellules de quartier
│       ├── Formation.js/css    # Présentation formation
│       ├── FormationInscription.js/css  # Inscription 4 étapes
│       ├── FormationInscriptionSuccess.js/css
│       ├── FormationPaiement.js/css
│       ├── Dons.js/css         # Page dons (non connectée)
│       ├── Pasteur.js/css      # Couple pastoral
│       ├── Admin.js/css        # Panneau admin complet (2750 lignes)
│       ├── EleveLogin.js/css   # Connexion espace élève
│       ├── EleveLayout.js      # Layout sidebar élève
│       ├── EleveDashboard.js   # Dashboard élève
│       ├── EleveModules.js     # Modules + ressources
│       ├── EleveCours.js/css   # Cours en live Zoom
│       ├── EleveEvaluations.js # Évaluations
│       ├── ElevePaiements.js   # Suivi paiements
│       ├── EleveProfil.js      # Profil modifiable
│       ├── EleveMessages.js/css # Messagerie temps réel
│       └── Eleve.css           # Styles communs espace élève
├── supabase/
│   └── migrations/
│       ├── 20260818_formules_paiement.sql    # Table formules_paiement + RLS
│       ├── 20260818_formules_avantages.sql   # Colonne avantages JSONB
│       └── 20260818_eleves_formule_figee.sql # Colonnes formule figées sur eleves
├── package.json
├── vercel.json                 # Rewrite SPA
├── .gitignore                  # .env.local ignoré
└── .env.local                  # Variables Supabase (présent, non commité)
```

### 2.2 Routes déclarées

| Route | Composant | Protection |
|-------|-----------|------------|
| `/` | Home | Public |
| `/cultes` | Cultes | Public |
| `/montagne-priere` | MontagnePriere | Public |
| `/predication` | Predication | Public |
| `/cellule` | Cellule | Public |
| `/formation` | Formation | Public |
| `/formation/inscription` | FormationInscription | Public |
| `/formation/inscription/success` | FormationInscriptionSuccess | Public |
| `/formation/paiement` | FormationPaiement | Public |
| `/dons` | Dons | Public |
| `/pasteur` | Pasteur | Public |
| `/admin` | Admin | Authentification admin côté client |
| `/eleve/login` | EleveLogin | Public |
| `/eleve/*` | EleveLayout + sous-routes | ProtectedRoute (session) |

### 2.3 Dépendances (package.json)

**Installées :**
- @supabase/supabase-js ^2.39.0
- flag-icons ^7.5.0
- react ^18.2.0
- react-dom ^18.2.0
- react-router-dom ^6.22.0
- react-scripts 5.0.1
- react-simple-maps ^3.0.0
- recharts ^3.8.1

**Analyse :**
- Pas de dépendance Stripe installée (stripe, @stripe/stripe-js absents)
- Pas de dépendance inutilisée détectée
- `npm audit` révèle 4 vulnérabilités :
  - **HIGH:** @babel/plugin-transform-modules-systemjs (code injection, 7.12.0-7.29.0)
  - **MODERATE:** @remix-run/router (open redirect, >=1.3.0 <1.23.3)
  - **LOW:** @babel/core (file read via sourceMappingURL)
  - **LOW:** jest-config (via @jest/core)

Ces vulnérabilités proviennent de dépendances transitives de react-scripts. Recommandation : mettre à jour react-scripts ou migrer vers Vite.

---

## 3. Base de données (Supabase)

### 3.1 Fichiers SQL présents

Le projet ne contient que **3 fichiers SQL** dans `supabase/migrations/`, tous datés du 2026-08-18 :

1. `20260818_formules_paiement.sql` : Crée `formules_paiement`, ajoute `formule_id` sur `eleves` et `inscriptions_formation`
2. `20260818_formules_avantages.sql` : Ajoute colonne `avantages` JSONB sur `formules_paiement`
3. `20260818_eleves_formule_figee.sql` : Colonnes figées (formule_nom, formule_type, formule_prix_total, etc.) sur `eleves`

**PROBLÈME MAJEUR :** Le fichier `full_reset.sql` mentionné dans le contexte n'est pas présent dans le projet. Les 22 tables listées dans le contexte ne sont pas définies dans les fichiers SQL versionnés.

### 3.2 Tables utilisées dans le code (grep sur src/)

| Table | Utilisée par | Fichier |
|-------|--------------|---------|
| `videos` | getVideos, addVideo, deleteVideo | supabase.js |
| `fichiers` | getFichiers, uploadFichier, deleteFichier | supabase.js |
| `messages_priere` | getMessagesDuJour, getAllMessages, upsertMessage | supabase.js |
| `cultes` | getCultes, addCulte, deleteCulte, getAnciensCultes | supabase.js |
| `eleves` | getEleveProfil, getAllElevesAvecStats, updateEleveProfil, etc. | supabase.js |
| `evaluations` | getEvaluations, ajouterEvaluation | supabase.js |
| `paiements` | getPaiements, ajouterPaiement | supabase.js |
| `progression_eleve` | getModulesAvecProgression, updateProgressionModule | supabase.js |
| `modules_formation` | getModulesFormation, createModuleFormation, etc. | supabase.js |
| `sessions_live` | getSessionsLive, createSessionLive, etc. | supabase.js |
| `sessions_participants` | inviteParticipantsToSession, getMesSessionsLive | supabase.js |
| `messages` | getMessagesWithEleve, envoyerMessage, etc. | supabase.js |
| `ressources_module` | getRessourcesModule, createRessource, etc. | supabase.js |
| `formules_paiement` | getFormulesPaiement, createFormulePaiement, etc. | supabase.js |
| `inscriptions_formation` | createInscriptionAutoSave | supabase.js |
| `admins` | checkIsAdmin | supabase.js |

**Tables attendues mais non définies dans les SQL versionnés :**
- videos, fichiers, cultes, eleves (structure complète), evaluations, paiements
- progression_eleve, sessions_live, sessions_participants, messages
- ressources_module, inscriptions_formation, admins
- cell_groups, donations, members, services, prayer_weeks (mentionnées dans contexte)

### 3.3 RLS (Row Level Security)

**Analysé dans les fichiers SQL présents :**

`formules_paiement` :
- RLS activé
- `formules_paiement_read_public` : lecture si `actif = true`
- `formules_paiement_read_admin` : lecture complète si `auth.uid() IN (SELECT auth_user_id FROM admins)`
- `formules_paiement_write_admin` : écriture si admin

**ATTENTION (piège mentionné) :** La policy admin sur `formules_paiement` utilise une sous-requête vers `admins`. Si la table `admins` a une policy qui appelle `is_admin()`, cela créerait une récursion infinie. Le code utilise `auth.uid() IN (SELECT...)` ce qui évite ce problème.

**Tables sans RLS documenté :** Toutes les autres tables (eleves, messages, paiements, etc.) n'ont pas de policies définies dans les fichiers versionnés. C'est un **risque de sécurité majeur** si RLS n'est pas configuré côté Supabase Dashboard.

### 3.4 Triggers et fonctions

**Référencées dans le code mais non définies dans les SQL versionnés :**
- `handle_new_user_inscription()` : trigger mentionné sur `auth.users` pour créer automatiquement l'élève
- `is_admin()` : fonction mentionnée pour vérifier le rôle admin
- `update_ma_derniere_connexion()` : RPC appelée après connexion élève
- `get_eleves_email_confirmed()` : RPC pour récupérer les confirmations email

### 3.5 Problèmes de schéma détectés

1. **Colonnes `progression_pct` :** Utilisée dans le code (eleve.progression_pct) mais jamais recalculée automatiquement
2. **Dates en texte :** `date_culte` stocké en format `YYYY-MM-DD` (string) au lieu de `DATE`
3. **Convention messages :** expediteur_id = auth_user_id, destinataire_id = eleves.id (OK, documenté)

---

## 4. Fonctionnel : état par fonctionnalité

### 4.1 Pages publiques

| Page | Statut | Fichiers | Justification |
|------|--------|----------|---------------|
| Home | ✅ Terminé | Home.js, Home.css | Grille sections fonctionnelle, hero pasteur |
| Cultes | ✅ Terminé | Cultes.js, Cultes.css | Programme + replay YouTube intégré |
| Montagne Prière | ✅ Terminé | MontagnePriere.js, css | 12 familles, message du jour |
| Prédications | ✅ Terminé | Predication.js, css | Grille vidéos YouTube, lecture inline |
| Cellules | ✅ Terminé | Cellule.js, css | Liste cellules + programme type |
| Formation | ✅ Terminé | Formation.js, css | Présentation + FAQ |
| Pasteur | ✅ Terminé | Pasteur.js, css | Bio couple pastoral |
| Dons | 🟡 Partiel | Dons.js, css | UI fonctionnelle mais **pas de paiement réel** |

### 4.2 Panneau admin

| Fonctionnalité | Statut | Justification |
|----------------|--------|---------------|
| Connexion admin | ✅ Terminé | signIn + checkIsAdmin |
| CRUD Vidéos | ✅ Terminé | TabVideos |
| CRUD Messages prière | ✅ Terminé | TabPriere |
| CRUD Cultes/Cellules | ✅ Terminé | TabCultes |
| Liste élèves + stats | ✅ Terminé | SubTabEleves |
| Carte monde élèves | ✅ Terminé | SubTabCarte avec react-simple-maps |
| Statistiques formation | ✅ Terminé | SubTabStats avec recharts |
| Gestion modules | ✅ Terminé | SubTabRessources (création, édition, réordonnancement) |
| Gestion ressources | ✅ Terminé | Upload fichiers + liens |
| Gestion sessions live | ✅ Terminé | SubTabCours |
| Messagerie admin | ✅ Terminé | SubTabMessages (temps réel) |
| Gestion formules paiement | ✅ Terminé | SubTabFormules (CRUD complet) |
| Drawer élève complet | ✅ Terminé | Profil, progression, évaluations, paiements, notes |
| Ajout paiement manuel | ✅ Terminé | PaiementsSection.handleMarquerPaye |
| Gestion inscriptions | ❌ Manquant | Pas d'UI pour voir/valider les inscriptions en attente |
| CRUD Annonces | ❌ Manquant | Table non utilisée |
| CRUD Membres | ❌ Manquant | Table `members` non utilisée |
| CRUD Services | ❌ Manquant | Table `services` non utilisée |
| Semaines de prière | ❌ Manquant | Table `prayer_weeks` non utilisée |

### 4.3 Espace élève

| Fonctionnalité | Statut | Justification |
|----------------|--------|---------------|
| Inscription 4 étapes | ✅ Terminé | FormationInscription.js complet |
| Connexion | ✅ Terminé | EleveLogin.js |
| Dashboard | ✅ Terminé | EleveDashboard.js |
| Mes modules | ✅ Terminé | EleveModules.js avec ressources |
| Évaluations | ✅ Terminé | EleveEvaluations.js |
| Paiements | ✅ Terminé | ElevePaiements.js (visualisation) |
| Profil | ✅ Terminé | EleveProfil.js |
| Messagerie | ✅ Terminé | EleveMessages.js (temps réel) |
| Cours en live | ✅ Terminé | EleveCours.js |
| Ressources modules | ✅ Terminé | Intégré dans EleveModules.js |
| Paiement Stripe | ❌ Manquant | stripe.js contient uniquement des stubs |
| progression_pct | 🐞 Bugué | Jamais recalculé automatiquement |

### 4.4 Points spécifiques mentionnés

| Point | Statut | Détail |
|-------|--------|--------|
| progression_pct jamais recalculé | 🐞 Bugué | Pas de trigger ni de fonction de recalcul |
| Pas d'UI admin pour inscriptions | ❌ Manquant | Confirmé |
| Bouton ajout paiement manuel | ✅ Résolu | Présent dans PaiementsSection |
| Stripe absent | ❌ Manquant | stripe.js = stubs uniquement |
| Réseaux sociaux (Facebook, YouTube) | 🟡 Partiel | Icônes présentes, liens placeholder (#) |

---

## 5. Qualité du code

### 5.1 Bugs probables

| Fichier | Ligne | Problème | Gravité |
|---------|-------|----------|---------|
| supabase.js | 587 | `progressions_module` au lieu de `progression_eleve` (EleveDrawer) | Important |
| Admin.js | ~587 | Requête `progressions_module` mais table s'appelle `progression_eleve` | Important |
| EleveDashboard.js | 182 | `eleve?.progression_pct ?? 0` peut afficher 0 même si non calculé | Mineur |

### 5.2 Gestion async/erreurs

- **Bonne pratique :** La plupart des fonctions Supabase utilisent `try/catch` ou vérifient `error`
- **Manque :** Pas de retry automatique sur erreur réseau
- **Manque :** Pas de boundary d'erreur React global

### 5.3 Organisation du code

- **Admin.js (2750 lignes) :** Fichier trop volumineux, devrait être découpé en sous-composants
- **supabase.js (1237 lignes) :** Contient helpers, mock data, auth, RPC, tout mélangé
- **Duplication :** Fonctions `formatRelative`, `initiales` dupliquées dans Admin.js et mock

### 5.4 Variables d'environnement

- `.env.local` présent avec `REACT_APP_SUPABASE_URL` et `REACT_APP_SUPABASE_ANON_KEY`
- `.env.local` bien ignoré dans `.gitignore`
- **OK :** Seule la clé anon est utilisée (acceptable côté client)
- **Attention :** Pas de `REACT_APP_STRIPE_*` défini (normal puisque Stripe non intégré)

### 5.5 SEO et accessibilité

**SEO (public/index.html) :**
- ✅ `<title>` présent
- ✅ `<meta name="description">` présent
- ✅ Open Graph tags présents (og:title, og:description, og:image)
- ✅ Twitter Card tags présents
- 🟡 Pas de sitemap.xml
- 🟡 Pas de robots.txt

**Accessibilité :**
- 🟡 Certains boutons sans `aria-label` explicite
- 🟡 Pas de skip-to-content link
- ✅ Images ont des `alt` tags

### 5.6 Performance

| Problème | Fichier | Impact |
|----------|---------|--------|
| `select('*')` fréquent | supabase.js | Charge des colonnes inutiles |
| Pas de pagination | getAllElevesAvecStats | Problème si >100 élèves |
| Polling 3s messagerie | EleveMessages.js, Admin.js | Requêtes fréquentes |
| Images non optimisées | Pas de next/image ou équivalent | Chargement lent |
| Bundle main.js 124KB gzipped | Build output | Acceptable |

---

## 6. Sécurité

### 6.1 Failles identifiées

| Problème | Gravité | Fichier | Ligne |
|----------|---------|---------|-------|
| Protection admin côté client uniquement | **CRITIQUE** | Admin.js | checkIsAdmin() |
| RLS non vérifié sur toutes les tables | **CRITIQUE** | (Supabase) | - |
| Pas de vérification rôle côté serveur | **CRITIQUE** | supabase.js | toutes les fonctions admin |
| Upload fichiers sans validation type MIME | Important | supabase.js | uploadFichier() |
| select('*') expose toutes les colonnes | Mineur | supabase.js | multiple |

### 6.2 Détail : protection admin

```javascript
// Admin.js ligne 549-563
export async function checkIsAdmin() {
  if (IS_MOCK) return true;
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user?.id) return false;
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id')
    .eq('auth_user_id', data.session.user.id)
    .maybeSingle();
  return !!admin;
}
```

**Problème :** Cette vérification est effectuée côté client. Un attaquant peut :
1. Modifier le code JS pour bypasser `checkIsAdmin()`
2. Appeler directement les fonctions Supabase (insert, update, delete)

**Solution requise :** Implémenter des policies RLS sur toutes les tables sensibles avec vérification `auth.uid() IN (SELECT auth_user_id FROM admins)`.

### 6.3 OWASP Top 10

| Vulnérabilité | Statut |
|---------------|--------|
| A01 Broken Access Control | **PRÉSENT** (RLS incomplet) |
| A02 Cryptographic Failures | OK (Supabase gère) |
| A03 Injection | OK (Supabase paramétré) |
| A05 Security Misconfiguration | **PRÉSENT** (RLS incomplet) |
| A07 XSS | OK (React échappe) |

---

## 7. Déploiement

### 7.1 Configuration Vercel

**vercel.json :**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
- ✅ Rewrite SPA correct

### 7.2 Build

```
npm run build : SUCCESS
```

**Taille du build (gzipped) :**
- main.js : 124 KB
- Plus gros chunk (react-simple-maps) : 141 KB
- Total CSS : ~35 KB

**Warnings :** Aucun

### 7.3 Variables d'environnement requises (Vercel)

| Variable | Requis | Présent localement |
|----------|--------|-------------------|
| REACT_APP_SUPABASE_URL | Oui | Oui |
| REACT_APP_SUPABASE_ANON_KEY | Oui | Oui |
| REACT_APP_STRIPE_PUBLISHABLE_KEY | Non (Stripe non intégré) | Non |

---

## 8. Problèmes par gravité

### CRITIQUE

1. **RLS incomplet sur Supabase** : Les tables sensibles (eleves, paiements, messages, etc.) n'ont pas de policies documentées. Un utilisateur authentifié pourrait potentiellement lire/modifier les données d'autres utilisateurs.

2. **Protection admin côté client** : Toutes les opérations admin sont protégées uniquement par une vérification JS. Bypasser cette vérification permettrait à n'importe quel utilisateur authentifié d'exécuter des actions admin.

3. **Fichiers SQL incomplets** : Le schéma complet de la base (22 tables) n'est pas versionné. Impossible de recréer la base depuis le repo.

### IMPORTANT

4. **Stripe non intégré** : Les fonctions de paiement sont des stubs. L'inscription fonctionne mais le paiement n'est pas encaissé.

5. **Nom de table incohérent** : `progressions_module` vs `progression_eleve` dans Admin.js (ligne ~587).

6. **progression_pct jamais recalculé** : L'affichage de progression est statique et ne reflète pas la réalité.

7. **Vulnérabilités npm** : 1 HIGH (babel), 1 MODERATE (react-router).

8. **Réseaux sociaux placeholder** : Les liens Facebook/YouTube dans le Footer pointent vers `#`.

### MINEUR

9. **select('*') abusif** : Charge des colonnes inutiles.

10. **Polling 3s messagerie** : Charge serveur inutile quand WebSocket fonctionne.

11. **Admin.js trop volumineux** : 2750 lignes, difficile à maintenir.

12. **Pas de pagination élèves** : Problème potentiel si >100 élèves.

---

## 9. Plan d'action priorisé

### Phase 1 : Sécurité (CRITIQUE)

| # | Tâche | Effort | Priorité |
|---|-------|--------|----------|
| 1.1 | Créer et documenter les RLS policies pour toutes les tables | L | P0 |
| 1.2 | Versionner le schéma SQL complet (full_reset.sql + migrations) | M | P0 |
| 1.3 | Auditer les policies existantes sur Supabase Dashboard | S | P0 |

### Phase 2 : Corrections fonctionnelles

| # | Tâche | Effort | Priorité |
|---|-------|--------|----------|
| 2.1 | Corriger le nom de table `progressions_module` → `progression_eleve` | S | P1 |
| 2.2 | Créer trigger/fonction pour recalculer `progression_pct` | M | P1 |
| 2.3 | Ajouter UI admin pour gérer les inscriptions en attente | M | P1 |
| 2.4 | Mettre à jour les liens réseaux sociaux (Facebook, YouTube) | S | P1 |

### Phase 3 : Intégration Stripe

| # | Tâche | Effort | Priorité |
|---|-------|--------|----------|
| 3.1 | Installer @stripe/stripe-js | S | P2 |
| 3.2 | Créer Supabase Edge Function pour Stripe Checkout | M | P2 |
| 3.3 | Implémenter webhook Stripe pour notification paiement | M | P2 |
| 3.4 | Connecter FormationPaiement.js à Stripe | M | P2 |
| 3.5 | Ajouter portail client Stripe pour gestion abonnements | S | P2 |

### Phase 4 : Qualité et maintenance

| # | Tâche | Effort | Priorité |
|---|-------|--------|----------|
| 4.1 | Découper Admin.js en sous-composants | M | P3 |
| 4.2 | Découper supabase.js (auth, helpers, admin, eleve) | M | P3 |
| 4.3 | Mettre à jour react-scripts ou migrer vers Vite | M | P3 |
| 4.4 | Ajouter pagination sur getAllElevesAvecStats | S | P3 |
| 4.5 | Remplacer select('*') par sélections explicites | S | P3 |
| 4.6 | Ajouter sitemap.xml et robots.txt | S | P3 |

**Légende effort :** S = Small (<30 min), M = Medium (1-3h), L = Large (>3h)

---

## 10. Quick wins (< 30 minutes chacun)

1. **Mettre à jour les liens réseaux sociaux** : Footer.js ligne 6-7, remplacer `url: '#'` par les vraies URLs

2. **Corriger le nom de table** : Admin.js ~ligne 587, changer `progressions_module` en `progression_eleve`

3. **Ajouter robots.txt** : Créer `public/robots.txt` avec `User-agent: * Allow: /`

4. **Ajouter sitemap.xml** : Créer `public/sitemap.xml` basique avec les routes publiques

5. **Optimiser select()** : Dans getEleveProfil, remplacer `select('*')` par les colonnes nécessaires

6. **Ajouter aria-labels** : Sur les boutons icône sans texte (Admin.js, boutons delete/edit)

---

**Fin de l'audit**
