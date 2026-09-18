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

## Phase 1: src/lib reorganisation [TERMINE]

### Fichiers crees

- [x] `src/lib/client.js`: Client Supabase et constantes
- [x] `src/lib/auth.js`: Fonctions d'authentification (signIn, signOut, getSession, checkIsAdmin avec role)
- [x] `src/lib/public.js`: Lectures publiques (videos, services, cell_groups, messages_priere, announcements, site_settings, formules)
- [x] `src/lib/eleve.js`: Fonctions eleve (profil, modules, paiements, messages, ressources signees)
- [x] `src/lib/admin.js`: Fonctions admin (CRUD toutes tables, stats, exports)
- [x] `src/lib/money.js`: formatEuros(cents), eurosVersCents(euros)

### Aliases de compatibilite (supabase.js)

- getCultes -> getServices (avec mapping date_culte -> date_service)
- addCulte -> addService
- deleteCulte -> deleteService
- getAllMessages -> getAllMessagesPriere
- upsertMessage -> upsertMessagePriere

---

## Phase 2: Pages publiques [TERMINE]

| Page | Fichier | Statut |
|------|---------|--------|
| Home | src/pages/Home.js | A faire (annonces epinglees, prochain service) |
| Cultes | src/pages/Cultes.js | [x] Utilise getServices, date_service, replay_url |
| Cellule | src/pages/Cellule.js | [x] Utilise getCellGroups |
| MontagnePriere | src/pages/MontagnePriere.js | OK (inchange) |
| Predication | src/pages/Predication.js | OK (inchange) |
| Formation | src/pages/Formation.js | OK (formules lues via public.js) |
| Dons | src/pages/Dons.js | OK (interface statique) |
| Pasteur | src/pages/Pasteur.js | OK (inchange) |
| Footer | src/components/Footer.js | [x] Lit site_settings |

---

## Phase 3: Espace eleve [TERMINE]

| Page | Fichier | Statut |
|------|---------|--------|
| FormationInscription | src/pages/FormationInscription.js | [x] Supprime createInscriptionAutoSave |
| EleveLogin | src/pages/EleveLogin.js | OK (inchange) |
| EleveDashboard | src/pages/EleveDashboard.js | OK (colonnes adaptees via eleve.js) |
| EleveModules | src/pages/EleveModules.js | [x] URL signees pour ressources (getSignedUrlRessource) |
| EleveEvaluations | src/pages/EleveEvaluations.js | OK (inchange) |
| ElevePaiements | src/pages/ElevePaiements.js | [x] montant_cents, formatEuros de lib/money |
| EleveProfil | src/pages/EleveProfil.js | [x] formatEuros, formule_prix_total_cents |
| EleveMessages | src/pages/EleveMessages.js | [x] sender_role, eleve_id, realtime filtre eleve_id |
| EleveCours | src/pages/EleveCours.js | OK (inchange) |

---

## Phase 4: Admin [EN COURS]

### Corrections effectuees dans Admin.js

- [x] Ligne 586: `progressions_module` -> `progression_eleve`
- [x] formule_prix_total -> formule_prix_total_cents
- [x] formule_montant_echeance -> formule_montant_echeance_cents
- [x] p.montant -> p.montant_cents
- [x] date_culte -> date_service dans TabCultes
- [x] ajouterPaiement utilise montant_cents

### Decoupage Admin.js (non fait)

Le fichier Admin.js (2749 lignes) pourrait etre decoupe mais fonctionne en l'etat.
Les nouvelles tables (announcements, cell_groups, site_settings) sont accessibles via lib/admin.js.

### Permissions admin

Le role admin est expose via checkIsAdmin() qui retourne { isAdmin, role }.
Roles: 'editor' (acces limite), 'admin', 'super_admin' (acces complet).

---

## Phase 5: Qualite [A FAIRE]

- [ ] Error Boundary global
- [ ] Etats de chargement et d'erreur partout
- [x] aria-label sur boutons icones (Footer.js)
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
