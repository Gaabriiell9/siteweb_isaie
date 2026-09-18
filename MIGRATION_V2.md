# Migration V2: Adaptation du front au nouveau schema

## PREUVES D'EXECUTION

### Etape 1: Script smoke-test

```
$ npm run test:smoke
=== SMOKE TEST SUPABASE ===
URL: https://azzwmilhqbcoyzqtycpk.supabase.co
Anon key: eyJhbGciOiJIUzI1NiIs...

--- LECTURE AUTORISEE (anon) ---
[OK]   videos - colonnes: id, titre, youtube_url, date_publi, is_live
[OK]   services - colonnes: id, type, titre, date_service, heure_debut, heure_fin, lien_live
[OK]   cell_groups - colonnes: id, nom, lieu, jour_semaine, heure_debut, heure_fin, responsable_nom
[OK]   messages_priere - colonnes: id, famille, jour_semaine, semaine, titre, contenu, verset
[OK]   announcements - colonnes: id, titre, contenu, pinned, date_publi, date_fin, visible
[OK]   site_settings - colonnes: cle, valeur
[OK]   formules_paiement - 2 formules, colonnes prix_total_cents, montant_echeance_cents OK
[OK]   modules_formation - 1 modules

--- LECTURE REFUSEE (anon) ---
[OK]   eleves - acces refuse (42501)
[OK]   paiements - acces refuse (42501)
[OK]   messages - acces refuse (42501)
[OK]   donations - acces refuse (42501)
[OK]   admins - acces refuse (42501)
[OK]   progression_eleve - acces refuse (42501)
[OK]   evaluations - acces refuse (42501)
[OK]   ressources_module - acces refuse (42501)
[OK]   sessions_live - acces refuse (42501)

--- INSERTION REFUSEE (anon) ---
[OK]   donations INSERT - refuse (PGRST204)
[OK]   videos INSERT - refuse (42501)
[OK]   announcements INSERT - refuse (42501)

--- RPC REFUSE (anon) ---
[OK]   rpc get_eleves_email_confirmed - refuse (42501)

===========================================
RESULTATS: 21 OK, 0 ECHEC
===========================================
```

### Etape 2: Suppression date_culte

```
$ grep -rn "date_culte" src/ --include="*.js"
(aucune sortie = 0 occurrence)
```

### Etape 3: Admin extraction

```
$ wc -l src/pages/Admin.js
211 src/pages/Admin.js

$ ls src/pages/admin/
index.js
TabAnnonces.js
TabCellules.js
TabDons.js
TabFormation.js
TabPriere.js
TabServices.js
TabSettings.js
TabVideos.js

$ npm run build
Compiled successfully.
File sizes after gzip:
  141.07 kB  build/static/js/177.04b91f93.chunk.js
  111.49 kB  build/static/js/main.0b0c9d64.js
  27.47 kB   build/static/js/233.9d369f58.chunk.js
  [...]
```

### Git log

```
$ git log --oneline | head -20
9971516 Etape 3.7: Extraction complete TabFormation - Admin.js 211 lignes
fbe2b3e Etape 3.6: Integration des tabs extraits dans Admin.js
3f30865 Etape 3.5: TabDons.js - lecture seule donations
d623bf8 Etape 3.4: TabSettings.js - site_settings avec upsert
41a5fd9 Etape 3.3: TabCellules.js - CRUD cell_groups
d6f8412 Etape 3.2: TabServices.js - CRUD services (culte/evenement)
cd3425e Etape 3.1: TabAnnonces.js - CRUD announcements
cf6f5e6 Etape 2: Suppression date_culte - utilise date_service partout
9f8dc31 Etape 1: Script smoke-test complet avec npm run test:smoke
ae49967 Phases D-E-F: verification flux, smoke test et qualite
dab9adf Phase C: Ajout role guards admin (editor vs admin/super_admin)
5c87c36 Phase A+B: corrections finales et Home page avec annonces/prochain service
7bc0294 Phase A: Nettoyage complet - suppression IS_MOCK et supabase.js
```

---

## Phase 1: src/lib reorganisation [TERMINE]

- [x] `src/lib/client.js`: Client Supabase et constantes
- [x] `src/lib/auth.js`: Fonctions d'authentification (signIn, signOut, getSession, checkIsAdmin avec role)
- [x] `src/lib/public.js`: Lectures publiques (videos, services, cell_groups, messages_priere, announcements, site_settings, formules)
- [x] `src/lib/eleve.js`: Fonctions eleve (profil, modules, paiements, messages, ressources signees)
- [x] `src/lib/admin.js`: Fonctions admin (CRUD toutes tables, stats, exports)
- [x] `src/lib/money.js`: formatEuros(cents), eurosVersCents(euros)
- [x] Supprime supabase.js (alias)
- [x] Supprime mockData.js
- [x] Supprime IS_MOCK

---

## Phase 2: Pages publiques [TERMINE]

- [x] Home.js: annonces (pinned desc, date_publi desc, limit 3) + prochain service
- [x] Cultes.js: date_service (plus de mapping date_culte)
- [x] Cellule.js: cell_groups
- [x] Footer.js: site_settings

---

## Phase 3: Espace eleve [TERMINE]

- [x] FormationInscription.js: prix_total_cents, montant_echeance_cents, formule_id
- [x] EleveDashboard.js: montant_cents, formule_prix_total_cents
- [x] ElevePaiements.js: montant_cents, formatEuros
- [x] EleveProfil.js: formule_prix_total_cents
- [x] EleveMessages.js: sender_role, eleve_id, realtime filtre eleve_id
- [x] EleveLayout.js: realtime filtre eleve_id

---

## Phase 4: Admin [TERMINE]

### Nouveaux onglets (src/pages/admin/)

- [x] TabAnnonces.js: CRUD announcements (image upload vers etc-files/site/)
- [x] TabServices.js: CRUD services (type culte/evenement)
- [x] TabCellules.js: CRUD cell_groups (jour_semaine Lundi-Dimanche)
- [x] TabSettings.js: site_settings (validation URL https)
- [x] TabDons.js: donations lecture seule (formatEuros)
- [x] TabVideos.js: CRUD videos
- [x] TabPriere.js: CRUD messages_priere (upsert)
- [x] TabFormation.js: tous les SubTab eleves, stats, cours, messages, ressources, formules

### Role guards

- editor: Annonces, Services, Cellules, Videos, Priere, Reglages (6 onglets)
- admin/super_admin: + Dons, Formation (8 onglets)
- Erreur 42501 affiche "Action non autorisee"

### Admin.js

Reduit a 211 lignes (coque: login, navigation, role guards).

---

## Phase 5: Qualite [TERMINE]

- [x] ErrorBoundary global (src/components/ErrorBoundary.js)
- [x] public/robots.txt (bloque /admin, /eleve, inscription)
- [x] public/sitemap.xml
- [x] scripts/smoke-test.mjs avec npm run test:smoke

---

## Correspondances schema

### Tables renommees

| Ancien | Nouveau |
|--------|---------|
| cultes | services |
| progressions_module | progression_eleve |
| fichiers | SUPPRIME |
| inscriptions_formation | SUPPRIME |

### Colonnes renommees

| Table | Ancien | Nouveau |
|-------|--------|---------|
| services | date_culte | date_service |
| formules_paiement | prix_total | prix_total_cents |
| formules_paiement | montant_echeance | montant_echeance_cents |
| formules_paiement | type='unique' | type='integral' |
| paiements | montant | montant_cents |
| donations | montant | montant_cents |
| messages | expediteur_id/destinataire_id | eleve_id + sender_role |

### Nouvelles tables

| Table | Description |
|-------|-------------|
| announcements | Annonces (pinned, visible, date_fin) |
| cell_groups | Groupes de cellules (jour_semaine fixe) |
| site_settings | Parametres (nom_eglise, facebook_url, youtube_url) |

---

## Fichiers crees

- src/lib/client.js
- src/lib/auth.js
- src/lib/public.js
- src/lib/eleve.js
- src/lib/admin.js
- src/lib/money.js
- src/lib/dateUtils.js
- src/pages/admin/index.js
- src/pages/admin/TabAnnonces.js
- src/pages/admin/TabServices.js
- src/pages/admin/TabCellules.js
- src/pages/admin/TabSettings.js
- src/pages/admin/TabDons.js
- src/pages/admin/TabVideos.js
- src/pages/admin/TabPriere.js
- src/pages/admin/TabFormation.js
- src/components/ErrorBoundary.js
- scripts/smoke-test.mjs
- public/robots.txt
- public/sitemap.xml

## Fichiers supprimes

- src/lib/supabase.js
- src/lib/mockData.js
