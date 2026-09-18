# Migration V2: Adaptation du front au nouveau schema

## Phase 0: Inventaire des appels Supabase

### Appels `.from('...')`

| Table ancienne | Fichier | Ligne | Colonnes utilisees | Action |
|---------------|---------|-------|-------------------|--------|
| `cultes` | src/lib/supabase.js | 168, 176, 184, 189 | id, titre, date_culte, heure_debut, heure_fin, type, groupe, visible, lien_live | REMPLACER par `services` et `cell_groups` |
| `videos` | src/lib/supabase.js | 88, 95, 99 | * | OK (inchange) |
| `fichiers` | src/lib/supabase.js | 105, 118, 129 | id, nom, description, type, storage_path, categorie, visible | SUPPRIMER (table supprimee) |
| `messages_priere` | src/lib/supabase.js | 141, 149, 156, 160 | *, jour_semaine, semaine, visible | OK (ajouter onConflict pour upsert) |
| `eleves` | src/lib/supabase.js | 248, 266, 308, 405, 427, 432, 456, 475, 500, 518 | *, auth_user_id, statut, paiements, progression_eleve, formule, pays, ville | ADAPTER colonnes montants en centimes |
| `progressions_module` | src/pages/Admin.js | 587 | *, module:modules_formation(*) | RENOMMER en `progression_eleve` |
| `progression_eleve` | src/lib/supabase.js | 280, 450, 1129 | *, modules_formation(*), eleve_id, module_id, debloque, complete | OK |
| `evaluations` | src/lib/supabase.js | 294, 437 | *, module:modules_formation(titre), eleve_id | OK |
| `paiements` | src/lib/supabase.js | 301, 441, 477, 482 | *, eleve_id, montant, statut, date_paiement | ADAPTER montant -> montant_cents |
| `inscriptions_formation` | src/lib/supabase.js | 317, 395, 477 | *, created_at, formule, niveau_biblique | SUPPRIMER (table supprimee) |
| `admins` | src/lib/supabase.js | 553 | id, auth_user_id, role | ADAPTER pour exposer role |
| `modules_formation` | src/lib/supabase.js | 673, 688, 696, 705, 720, 731 | *, numero, titre, description, duree_semaines | OK (colonne contenu supprimee) |
| `sessions_live` | src/lib/supabase.js | 731, 747, 753, 758, 778 | *, module:modules_formation(numero, titre) | OK |
| `sessions_participants` | src/lib/supabase.js | 764, 778, 802, 809 | *, eleve:eleves(*), session_id, eleve_id | OK |
| `messages` | src/lib/supabase.js | 866, 881, 903, 919, 930, 937, 948, 981, 1013, 1029, 1044 | * avec expediteur_id, destinataire_id, expediteur_type | ADAPTER au nouveau modele (eleve_id, sender_role) |
| `ressources_module` | src/lib/supabase.js | 1059, 1076, 1091, 1102, 1107, 1129 | *, module:modules_formation(numero, titre), module_id | OK (ajouter storage_path, URL signees) |
| `formules_paiement` | src/lib/supabase.js | 1173, 1188, 1198, 1209, 1216, 1234 | *, actif, ordre_affichage, prix_total, montant_echeance | ADAPTER colonnes en centimes |

### Appels `.rpc('...')`

| Fonction | Fichier | Ligne | Usage |
|----------|---------|-------|-------|
| `update_ma_derniere_connexion` | src/lib/supabase.js | 220 | OK (inchange) |
| `get_eleves_email_confirmed` | src/lib/supabase.js | 411 | OK (inchange) |

### Appels `.storage.from('...')`

| Bucket | Fichier | Ligne | Usage | Action |
|--------|---------|-------|-------|--------|
| `etc-files` | src/lib/supabase.js | 115, 117, 128 | getFichiers, uploadFichier, deleteFichier | SUPPRIMER fonctions fichiers |
| `etc-files` | src/lib/supabase.js | 1116, 1118 | uploadRessourceFile | REMPLACER par bucket `ressources` |

### Subscriptions realtime

| Table | Fichier | Ligne | Filtre | Action |
|-------|---------|-------|--------|--------|
| `messages` | src/lib/supabase.js (via Admin.js) | 1616 | INSERT | ADAPTER filtre eleve_id |
| `messages` | src/pages/EleveMessages.js | 78 | INSERT, destinataire_id/expediteur_id | ADAPTER filtre eleve_id |

---

## Correspondances ancien vers nouveau

### Tables renommees ou remplacees

| Ancien | Nouveau | Notes |
|--------|---------|-------|
| `cultes` (type='culte') | `services` | date_culte -> date_service, replay dans replay_url |
| `cultes` (type='cellule') | `cell_groups` | Nouvelle structure, jour_semaine fixe |
| `progressions_module` | `progression_eleve` | Meme structure |
| `fichiers` | SUPPRIME | Pas de remplacement |
| `inscriptions_formation` | SUPPRIME | Gere par trigger serveur |

### Colonnes renommees

| Table | Ancien | Nouveau |
|-------|--------|---------|
| services | date_culte | date_service |
| formules_paiement | prix_total | prix_total_cents |
| formules_paiement | montant_echeance | montant_echeance_cents |
| formules_paiement | type='unique' | type='integral' |
| eleves | formule_prix_total | formule_prix_total_cents |
| eleves | formule_montant_echeance | formule_montant_echeance_cents |
| paiements | montant | montant_cents |
| donations | montant | montant_cents |
| messages | expediteur_id/destinataire_id | eleve_id + sender_role |

### Colonnes supprimees

| Table | Colonne | Raison |
|-------|---------|--------|
| cultes | groupe | Remplace par cell_groups.nom |
| modules_formation | contenu | Remplace par ressources_module |
| eleves | formule_type | Redondant avec formule |
| eleves | inscription_id | Plus de table inscriptions |
| messages | expediteur_type | Remplace par sender_role |
| messages | destinataire_id | Remplace par eleve_id |
| messages | destinataire_type | Toujours admin ou eleve implicite |

### Nouvelles colonnes

| Table | Colonne | Type |
|-------|---------|------|
| eleves | pasteur_referent | text |
| eleves | niveau_biblique | text |
| eleves | motivation | text |
| eleves | communications_ok | boolean |
| services | predicateur | text |
| services | theme | text |
| services | replay_url | text |
| ressources_module | storage_path | text |
| messages | sender_auth_id | uuid |

### Nouvelles tables

| Table | Description |
|-------|-------------|
| announcements | Annonces du site (pinned, visible, date_fin) |
| cell_groups | Groupes de cellules (jour_semaine fixe) |
| site_settings | Parametres (nom_eglise, facebook_url, youtube_url) |

---

## Phase 1: src/lib reorganisation

### Fichiers a creer

- `src/lib/client.js`: Client Supabase et constantes
- `src/lib/auth.js`: Fonctions d'authentification (signIn, signOut, getSession, checkIsAdmin avec role)
- `src/lib/public.js`: Lectures publiques (videos, services, cell_groups, messages_priere, announcements, site_settings, formules)
- `src/lib/eleve.js`: Fonctions eleve (profil, modules, paiements, messages, ressources signees)
- `src/lib/admin.js`: Fonctions admin (CRUD toutes tables, stats, exports)
- `src/lib/money.js`: formatEuros(cents), eurosVersCents(euros)

### Fonctions a supprimer

- getFichiers, uploadFichier, deleteFichier (table fichiers supprimee)
- createInscriptionAutoSave (table inscriptions_formation supprimee)
- getInscriptionsRecentes (plus de table inscriptions)
- getCultes, getAnciensCultes, addCulte, deleteCulte (remplacer par services/cell_groups)

---

## Phase 2: Pages publiques

| Page | Fichier | Changements |
|------|---------|-------------|
| Home | src/pages/Home.js | Ajouter annonces epinglees, prochain service |
| Cultes | src/pages/Cultes.js | Lire `services`, replay dans replay_url |
| Cellule | src/pages/Cellule.js | Lire `cell_groups` au lieu de cultes type='cellule' |
| MontagnePriere | src/pages/MontagnePriere.js | Inchange (messages_priere) |
| Predication | src/pages/Predication.js | Inchange (videos) |
| Formation | src/pages/Formation.js | Lire formules_paiement avec prix_total_cents |
| Dons | src/pages/Dons.js | Interface statique (pas d'insertion) |
| Pasteur | src/pages/Pasteur.js | Inchange |
| Footer | src/components/Footer.js | Lire site_settings (facebook_url, youtube_url) |

---

## Phase 3: Espace eleve

| Page | Fichier | Changements |
|------|---------|-------------|
| FormationInscription | src/pages/FormationInscription.js | formule_id dans user_metadata, prix en centimes |
| EleveLogin | src/pages/EleveLogin.js | Inchange |
| EleveDashboard | src/pages/EleveDashboard.js | Adapter colonnes |
| EleveModules | src/pages/EleveModules.js | URL signees pour ressources |
| EleveEvaluations | src/pages/EleveEvaluations.js | Inchange |
| ElevePaiements | src/pages/ElevePaiements.js | montant_cents, formatEuros |
| EleveProfil | src/pages/EleveProfil.js | Champs autorises uniquement (pas statut, formule_*, email) |
| EleveMessages | src/pages/EleveMessages.js | Nouveau modele (eleve_id, sender_role), realtime filtre eleve_id |
| EleveCours | src/pages/EleveCours.js | Inchange |

---

## Phase 4: Admin

### Decoupage Admin.js

| Nouveau fichier | Contenu |
|-----------------|---------|
| src/pages/admin/TabVideos.js | Gestion videos |
| src/pages/admin/TabPriere.js | Messages de priere (onConflict) |
| src/pages/admin/TabServices.js | Services (ex-cultes) |
| src/pages/admin/TabCellules.js | NOUVEAU: cell_groups |
| src/pages/admin/TabAnnonces.js | NOUVEAU: announcements |
| src/pages/admin/TabFormation.js | Sous-tabs eleves, formules, cours, messages, ressources, carte, stats |
| src/pages/admin/TabDons.js | NOUVEAU: lecture seule donations |
| src/pages/admin/TabSettings.js | NOUVEAU: site_settings (nom_eglise, liens sociaux) |

### Corrections specifiques

- Admin.js ligne 587: `progressions_module` -> `progression_eleve`
- Montants: formules et paiements en centimes
- Messages admin: nouveau modele avec eleve_id, sender_role='admin'
- Permissions: role 'editor' ne voit que Annonces, Services, Cellules, Videos, Priere, Reglages

---

## Phase 5: Qualite

- [ ] Error Boundary global
- [ ] Etats de chargement et d'erreur partout
- [ ] aria-label sur boutons icones
- [ ] Lien "aller au contenu"
- [ ] public/robots.txt
- [ ] public/sitemap.xml
- [ ] npm audit (documenter vulnerabilites react-scripts)

---

## Changements BD demandes

(A remplir si un changement de schema est indispensable)

---

## Checklist de test manuel

- [ ] Inscription d'un nouvel eleve (fiche et formule creees)
- [ ] Connexion eleve
- [ ] Modification du profil eleve
- [ ] Echec attendu d'un update du statut depuis la console
- [ ] Messagerie eleve vers admin
- [ ] Messagerie admin vers eleve (temps reel)
- [ ] Ouverture d'une ressource d'un module debloque (URL signee)
- [ ] Connexion admin
- [ ] Creation d'une annonce
- [ ] Creation d'un service
- [ ] Creation d'une cellule
- [ ] Changement des liens sociaux (site_settings)
- [ ] Marquage d'un module termine et progression mise a jour
- [ ] Ajout d'un paiement manuel (centimes)

---

## Fichiers touches

### A modifier

- src/lib/supabase.js (decoupe en plusieurs fichiers)
- src/lib/mockData.js (aligner sur nouveau schema ou supprimer)
- src/pages/Admin.js (decoupe en fichiers admin/)
- src/pages/Cultes.js (services)
- src/pages/Cellule.js (cell_groups)
- src/pages/Home.js (annonces, prochain service)
- src/pages/FormationInscription.js (centimes, formule_id)
- src/pages/EleveMessages.js (nouveau modele messages)
- src/pages/ElevePaiements.js (centimes)
- src/pages/EleveProfil.js (champs autorises)
- src/pages/EleveModules.js (URL signees)
- src/components/Footer.js (site_settings)

### A creer

- src/lib/client.js
- src/lib/auth.js
- src/lib/public.js
- src/lib/eleve.js
- src/lib/admin.js
- src/lib/money.js
- src/pages/admin/TabVideos.js
- src/pages/admin/TabPriere.js
- src/pages/admin/TabServices.js
- src/pages/admin/TabCellules.js
- src/pages/admin/TabAnnonces.js
- src/pages/admin/TabFormation.js
- src/pages/admin/TabDons.js
- src/pages/admin/TabSettings.js
- public/robots.txt
- public/sitemap.xml

### A supprimer (code mort)

- Fonctions getFichiers, uploadFichier, deleteFichier
- Fonction createInscriptionAutoSave
- Fonction getInscriptionsRecentes
- Fonctions getCultes, getAnciensCultes, addCulte, deleteCulte (apres remplacement)
- MOCK_INSCRIPTIONS_RECENTES

---

## Points ouverts

1. Le mode mock (IS_MOCK) est-il encore utile? Le supprimer simplifierait le code.
2. Les formules actuelles utilisent type='unique', le schema attend 'integral'. Migration de donnees necessaire?
3. La table messages_priere a une contrainte UNIQUE(famille, jour_semaine, semaine). L'upsert doit specifier onConflict.
