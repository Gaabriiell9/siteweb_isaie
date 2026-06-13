import { createClient } from '@supabase/supabase-js';

// ─── Utilitaires statut session ───────────────────────────────────
export function getSessionStatut(session) {
  const now = new Date();
  const debut = new Date(session.date_session);
  const fin = new Date(debut.getTime() + (session.duree_minutes || 60) * 60 * 1000);
  if (now < debut) return 'programme';
  if (now >= debut && now <= fin) return 'en_cours';
  return 'termine';
}
export const isSessionActive  = s => getSessionStatut(s) === 'en_cours';
export const isSessionAVenir  = s => getSessionStatut(s) === 'programme';
export const isSessionTermine = s => getSessionStatut(s) === 'termine';
import {
  MOCK_VIDEOS,
  MOCK_MESSAGES_PRIERE,
  MOCK_CULTES,
  MOCK_CELLULES,
  MOCK_ANCIENS_CULTES,
  MOCK_ELEVE,
  MOCK_MODULES_PROGRESSION,
  MOCK_EVALUATIONS,
  MOCK_PAIEMENTS,
} from './mockData';

const MOCK_SESSION_KEY = 'mock_eleve_session';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const IS_MOCK =
  !SUPABASE_URL ||
  SUPABASE_URL.includes('placeholder') ||
  !SUPABASE_ANON_KEY ||
  SUPABASE_ANON_KEY.includes('placeholder');


export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);

// ─── Helpers vidéos ───────────────────────────────────────────────
export async function getVideos() {
  if (IS_MOCK) return MOCK_VIDEOS;
  const { data, error } = await supabase
    .from('videos').select('*').eq('visible', true)
    .order('date_publi', { ascending: false });
  if (error) console.error(error);
  return data || [];
}
export async function addVideo(video) {
  if (IS_MOCK) return { error: null };
  return supabase.from('videos').insert([video]);
}
export async function deleteVideo(id) {
  if (IS_MOCK) return { error: null };
  return supabase.from('videos').delete().eq('id', id);
}

// ─── Helpers fichiers ─────────────────────────────────────────────
export async function getFichiers(categorie = null) {
  if (IS_MOCK) return [];
  let query = supabase.from('fichiers').select('*').eq('visible', true);
  if (categorie) query = query.eq('categorie', categorie);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) console.error(error);
  return data || [];
}
export async function uploadFichier(file, nom, description, categorie) {
  if (IS_MOCK) return { error: null };
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${nom.replace(/\s+/g, '-')}.${ext}`;
  const { error: upErr } = await supabase.storage.from('etc-files').upload(path, file);
  if (upErr) return { error: upErr };
  const { data: urlData } = supabase.storage.from('etc-files').getPublicUrl(path);
  return supabase.from('fichiers').insert([{
    nom, description,
    type: ext === 'pdf' ? 'pdf' : 'image',
    storage_path: urlData.publicUrl,
    categorie,
  }]);
}
export async function deleteFichier(id, storagePath) {
  if (IS_MOCK) return { error: null };
  const fileName = storagePath.split('/').pop();
  await supabase.storage.from('etc-files').remove([fileName]);
  return supabase.from('fichiers').delete().eq('id', id);
}

// ─── Helpers messages prière ──────────────────────────────────────
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export async function getMessagesDuJour() {
  if (IS_MOCK) {
    const jour = JOURS[new Date().getDay()];
    return MOCK_MESSAGES_PRIERE.find((m) => m.jour_semaine === jour) || null;
  }
  const jour = JOURS[new Date().getDay()];
  const { data, error } = await supabase
    .from('messages_priere').select('*').eq('visible', true).eq('jour_semaine', jour).limit(1);
  if (error) console.error(error);
  return data?.[0] || null;
}
export async function getAllMessages() {
  if (IS_MOCK) return MOCK_MESSAGES_PRIERE;
  const { data, error } = await supabase
    .from('messages_priere').select('*').eq('visible', true)
    .order('semaine').order('jour_semaine');
  if (error) console.error(error);
  return data || [];
}
export async function upsertMessage(msg) {
  if (IS_MOCK) return { error: null };
  return supabase.from('messages_priere').upsert([msg]);
}
export async function deleteMessage(id) {
  if (IS_MOCK) return { error: null };
  return supabase.from('messages_priere').delete().eq('id', id);
}

// ─── Helpers cultes / cellules ────────────────────────────────────
export async function getCultes(type = 'culte') {
  if (IS_MOCK) return type === 'cellule' ? MOCK_CELLULES : MOCK_CULTES;
  const { data, error } = await supabase
    .from('cultes').select('*').eq('visible', true).eq('type', type)
    .gte('date_culte', new Date().toISOString().split('T')[0]).order('date_culte');
  if (error) console.error(error);
  return data || [];
}
export async function getAnciensCultes() {
  if (IS_MOCK) return MOCK_ANCIENS_CULTES;
  const { data, error } = await supabase
    .from('cultes').select('*').eq('visible', true).eq('type', 'culte')
    .lt('date_culte', new Date().toISOString().split('T')[0])
    .not('lien_live', 'is', null).neq('lien_live', '')
    .order('date_culte', { ascending: false });
  if (error) console.error(error);
  return data || [];
}
export async function addCulte(culte) {
  if (IS_MOCK) return { error: null };
  return supabase.from('cultes').insert([culte]);
}
export async function deleteCulte(id) {
  if (IS_MOCK) return { error: null };
  return supabase.from('cultes').delete().eq('id', id);
}

// ─── Auth élève ───────────────────────────────────────────────────
export async function signInEleve(email, password) {
  if (IS_MOCK) {
    const session = { user: { id: 'mock-eleve-id', email } };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    return { data: session, error: null };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data: data?.session ? data : { user: data?.user }, error };
}
export async function signOutEleve() {
  if (IS_MOCK) { localStorage.removeItem(MOCK_SESSION_KEY); return; }
  await supabase.auth.signOut();
}
export async function getEleveSession() {
  if (IS_MOCK) {
    const stored = localStorage.getItem(MOCK_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Profil & données élève ───────────────────────────────────────
export async function getEleveProfil(authUserId) {
  if (IS_MOCK) return MOCK_ELEVE;
  const { data, error } = await supabase
    .from('eleves').select('*').eq('auth_user_id', authUserId).single();
  if (error) console.error(error);
  return data;
}
export async function getEleveStatut(authUserId) {
  if (IS_MOCK) return 'actif';
  const { data } = await supabase
    .from('eleves').select('statut').eq('auth_user_id', authUserId).single();
  return data?.statut || 'actif';
}
export async function getModulesAvecProgression(eleveId) {
  if (IS_MOCK) return MOCK_MODULES_PROGRESSION;
  const { data, error } = await supabase
    .from('progression_eleve').select('*, modules_formation(*)').eq('eleve_id', eleveId);
  if (error) console.error(error);
  return (data || []).map(p => ({
    ...p,
    titre: p.modules_formation?.titre,
    numero: p.modules_formation?.numero,
    description: p.modules_formation?.description,
    duree_semaines: p.modules_formation?.duree_semaines,
  }));
}
export async function getEvaluations(eleveId) {
  if (IS_MOCK) return MOCK_EVALUATIONS;
  const { data, error } = await supabase
    .from('evaluations').select('*, module:modules_formation(titre)')
    .eq('eleve_id', eleveId).order('date_eval', { ascending: false });
  if (error) console.error(error);
  return data || [];
}
export async function getPaiements(eleveId) {
  if (IS_MOCK) return MOCK_PAIEMENTS;
  const { data, error } = await supabase
    .from('paiements').select('*').eq('eleve_id', eleveId)
    .order('date_paiement', { ascending: false });
  if (error) console.error(error);
  return data || [];
}
export async function updateEleveProfil(eleveId, updates) {
  if (IS_MOCK) return { error: null };
  return supabase.from('eleves').update(updates).eq('id', eleveId);
}

// ─── Inscriptions formation — Auto-save ──────────────────────────
export async function createInscriptionAutoSave(data) {
  if (IS_MOCK) {
    return { error: null };
  }
  return supabase.from('inscriptions_formation').upsert([{ ...data, draft: true }]);
}

// ─── Inscription finale — création compte ────────────────────────
// Les données sont passées via user_metadata et un trigger côté Supabase
// crée automatiquement inscription + eleve + progression (SECURITY DEFINER)
export async function finalizeInscription(data) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 1500));
    return { success: true, user: { id: 'mock-id', email: data.email } };
  }

  // Passer toutes les données d'inscription via user_metadata
  // Le trigger handle_new_user_inscription() côté Supabase les utilisera
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        inscription_type: 'formation',
        prenom: data.prenom || '',
        nom: data.nom || 'Inconnu',
        telephone: data.telephone || null,
        date_naissance: data.date_naissance || null,
        pays: data.pays || null,
        ville: data.ville || null,
        eglise: data.eglise || null,
        pasteur_referent: data.pasteur_referent || null,
        niveau_biblique: data.niveau_biblique || null,
        motivation: data.motivation || null,
        formule: data.formule || 'echelonne',
        communications_ok: data.communications_ok || false,
      },
    },
  });

  console.log('[finalizeInscription] signUp response:', {
    user: authData?.user?.id,
    error: authError?.message
  });

  // Vérifier d'abord si le user a été créé
  if (authData?.user?.id) {
    console.log('[finalizeInscription] SUCCESS - user créé:', authData.user.id);
    return { success: true, user: authData.user };
  }

  // Si pas de user, regarder l'erreur
  if (authError) {
    const msg = authError.message?.toLowerCase() || '';

    // Erreurs connues à transformer en messages clairs
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return { success: false, error: { code: 'EMAIL_EXISTS', message: 'Un compte existe déjà avec cet email.' } };
    }

    // Erreurs d'email de confirmation — on ne peut rien faire sans user.id
    if (msg.includes('email') || msg.includes('sending') || msg.includes('confirmation')) {
      console.error('[finalizeInscription] Email error sans user créé:', authError);
      return { success: false, error: { code: 'EMAIL_ERROR', message: 'Erreur de configuration email. Contactez l\'administration.' } };
    }

    // Autres erreurs
    console.error('[finalizeInscription] Error:', authError);
    return { success: false, error: authError };
  }

  // Cas bizarre : pas d'erreur mais pas de user non plus
  console.error('[finalizeInscription] No user, no error - authData:', authData);
  return { success: false, error: { message: 'Erreur inattendue. Veuillez réessayer.' } };
}

// ─── Helpers admin formation ──────────────────────────────────────

export async function getInscriptionsRecentes(days = 30) {
  if (IS_MOCK) return MOCK_INSCRIPTIONS_RECENTES;
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from('inscriptions_formation').select('*')
    .gte('created_at', since).order('created_at', { ascending: false });
  if (error) console.error(error);
  return data || [];
}

export async function getAllElevesAvecStats() {
  if (IS_MOCK) return MOCK_ELEVES_STATS;
  const [elevesRes, confirmRes] = await Promise.all([
    supabase.from('eleves').select(`
      *,
      paiements(montant, statut, date_paiement),
      progression_eleve(complete)
    `).order('date_inscription', { ascending: false }),
    supabase.rpc('get_eleves_email_confirmed'),
  ]);
  if (elevesRes.error) console.error(elevesRes.error);
  const confirmMap = {};
  (confirmRes.data || []).forEach(r => { confirmMap[r.eleve_auth_id] = r.email_confirmed_at; });
  return (elevesRes.data || []).map(e => ({
    ...e,
    email_confirmed_at: confirmMap[e.auth_user_id] ?? null,
    total_paye: (e.paiements || [])
      .filter(p => p.statut === 'reussi')
      .reduce((s, p) => s + Number(p.montant), 0),
    modules_completes: (e.progression_eleve || []).filter(p => p.complete).length,
  }));
}

export async function suspendreEleve(eleveId, raison = '') {
  if (IS_MOCK) return { error: null };
  return supabase.from('eleves').update({ statut: 'suspendu', raison_suspension: raison }).eq('id', eleveId);
}

export async function reactiverEleve(eleveId) {
  if (IS_MOCK) return { error: null };
  return supabase.from('eleves').update({ statut: 'actif', raison_suspension: null }).eq('id', eleveId);
}

export async function ajouterEvaluation(eleveId, data) {
  if (IS_MOCK) return { error: null };
  return supabase.from('evaluations').insert([{ ...data, eleve_id: eleveId }]);
}

export async function ajouterPaiement(eleveId, data) {
  if (IS_MOCK) return { error: null };
  return supabase.from('paiements').insert([{ ...data, eleve_id: eleveId, statut: 'reussi' }]);
}

export async function updateProgressionModule(eleveId, moduleId, action) {
  if (IS_MOCK) return { error: null };
  const updates = action === 'debloquer'
    ? { debloque: true, date_debloque: new Date().toISOString() }
    : { complete: true, date_complete: new Date().toISOString() };
  return supabase.from('progression_eleve').update(updates)
    .eq('eleve_id', eleveId).eq('module_id', moduleId);
}

export async function updateNotesAdmin(eleveId, notes) {
  if (IS_MOCK) return { error: null };
  return supabase.from('eleves').update({ notes_admin: notes }).eq('id', eleveId);
}

export async function getStatistiquesFormation() {
  if (IS_MOCK) return MOCK_STATS_FORMATION;
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [
    { count: totalInscrits },
    { count: inscritsCeMois },
    { count: elevesActifs },
    { data: paiementsData },
    { data: inscriptionsData },
  ] = await Promise.all([
    supabase.from('eleves').select('*', { count: 'exact', head: true }),
    supabase.from('eleves').select('*', { count: 'exact', head: true })
      .gte('date_inscription', thisMonth),
    supabase.from('eleves').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
    supabase.from('paiements').select('montant, statut'),
    supabase.from('inscriptions_formation')
      .select('created_at, formule, niveau_biblique')
      .gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()),
  ]);

  const revenuTotal = (paiementsData || [])
    .filter(p => p.statut === 'reussi')
    .reduce((s, p) => s + Number(p.montant), 0);
  const paiementsReussis = (paiementsData || []).filter(p => p.statut === 'reussi').length;
  const tauxPaiement = totalInscrits ? Math.round((paiementsReussis / totalInscrits) * 100) : 0;

  return {
    totalInscrits: totalInscrits || 0,
    inscritsCeMois: inscritsCeMois || 0,
    elevesActifs: elevesActifs || 0,
    revenuTotal,
    tauxPaiement,
    inscriptionsParMois: inscriptionsData || [],
  };
}

export async function getElevesParPays() {
  if (IS_MOCK) return MOCK_ELEVES_PAR_PAYS;
  const { data, error } = await supabase
    .from('eleves').select('pays').not('pays', 'is', null);
  if (error) console.error(error);
  const counts = {};
  (data || []).forEach(e => { counts[e.pays] = (counts[e.pays] || 0) + 1; });
  return Object.entries(counts).map(([pays, count]) => ({ pays, count }))
    .sort((a, b) => b.count - a.count);
}

export async function exportElevesCSV() {
  if (IS_MOCK) {
    const csv = 'Prénom,Nom,Email,Pays,Formule,Statut,Progression\n' +
      MOCK_ELEVES_STATS.map(e =>
        `${e.prenom},${e.nom},${e.email},${e.pays || ''},${e.formule},${e.statut},${e.progression_pct}%`
      ).join('\n');
    downloadCSV(csv, 'eleves.csv');
    return;
  }
  const { data } = await supabase.from('eleves')
    .select('prenom, nom, email, pays, ville, formule, statut, progression_pct, date_inscription')
    .order('date_inscription', { ascending: false });
  if (!data) return;
  const headers = 'Prénom,Nom,Email,Pays,Ville,Formule,Statut,Progression,Date inscription';
  const rows = data.map(e =>
    `${e.prenom || ''},${e.nom},${e.email},${e.pays || ''},${e.ville || ''},${e.formule},${e.statut},${e.progression_pct}%,${e.date_inscription?.split('T')[0] || ''}`
  );
  downloadCSV([headers, ...rows].join('\n'), 'eleves-formation.csv');
}

function downloadCSV(csv, filename) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Auth admin ───────────────────────────────────────────────────
export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}
export async function signOut() {
  return supabase.auth.signOut();
}
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Ancienne fonction (compatibilité) ───────────────────────────
export async function addInscriptionFormation(data) {
  return createInscriptionAutoSave(data);
}

// ─── Mock data formation ──────────────────────────────────────────
const MOCK_INSCRIPTIONS_RECENTES = [
  { id: 'mock-1', prenom: 'Marie', nom: 'Dupont', email: 'marie@exemple.com', telephone: '+33 6 12 34 56 78', pays: 'France', ville: 'Paris', formule: 'integral', created_at: new Date(Date.now() - 2*24*3600*1000).toISOString() },
  { id: 'mock-2', prenom: 'Jean', nom: 'Kabila', email: 'jean@exemple.com', telephone: '+243 81 234 5678', pays: 'Congo (RDC)', ville: 'Kinshasa', formule: 'echelonne', created_at: new Date(Date.now() - 5*24*3600*1000).toISOString() },
  { id: 'mock-3', prenom: 'Sophie', nom: 'Martin', email: 'sophie@exemple.com', telephone: '+33 7 98 76 54 32', pays: 'Belgique', ville: 'Bruxelles', formule: 'integral', created_at: new Date(Date.now() - 8*24*3600*1000).toISOString() },
];
const MOCK_ELEVES_STATS = [
  { id: 'eleve-1', prenom: 'Marie', nom: 'Dupont', email: 'marie@exemple.com', pays: 'France', ville: 'Paris', formule: 'integral', statut: 'actif', progression_pct: 33, derniere_connexion: new Date(Date.now() - 1*24*3600*1000).toISOString(), total_paye: 450, modules_completes: 2, email_confirmed_at: new Date(Date.now() - 2*24*3600*1000).toISOString() },
  { id: 'eleve-2', prenom: 'Jean', nom: 'Kabila', email: 'jean@exemple.com', pays: 'Congo (RDC)', ville: 'Kinshasa', formule: 'echelonne', statut: 'actif', progression_pct: 17, derniere_connexion: new Date(Date.now() - 3*24*3600*1000).toISOString(), total_paye: 150, modules_completes: 1, email_confirmed_at: null },
  { id: 'eleve-3', prenom: 'Sophie', nom: 'Martin', email: 'sophie@exemple.com', pays: 'Belgique', ville: 'Bruxelles', formule: 'integral', statut: 'suspendu', progression_pct: 0, derniere_connexion: new Date(Date.now() - 14*24*3600*1000).toISOString(), total_paye: 0, modules_completes: 0, email_confirmed_at: new Date(Date.now() - 15*24*3600*1000).toISOString() },
];
const MOCK_ELEVES_PAR_PAYS = [
  { pays: 'France', count: 12 },
  { pays: 'Congo (RDC)', count: 8 },
  { pays: 'Belgique', count: 5 },
  { pays: 'Cameroun', count: 4 },
  { pays: 'Canada', count: 3 },
];
const MOCK_STATS_FORMATION = {
  totalInscrits: 32,
  inscritsCeMois: 7,
  elevesActifs: 28,
  revenuTotal: 8750,
  tauxPaiement: 62,
  inscriptionsParMois: [
    { mois: 'Nov', count: 3 },
    { mois: 'Déc', count: 5 },
    { mois: 'Jan', count: 4 },
    { mois: 'Fév', count: 6 },
    { mois: 'Mar', count: 7 },
    { mois: 'Avr', count: 7 },
  ],
};

// ─── Sessions live ────────────────────────────────────────────────

const MOCK_SESSIONS_LIVE = [
  {
    id: 'session-1',
    titre: 'Introduction à la Bible — Module 1',
    description: 'Session de présentation du programme et du module 1.',
    module_id: null,
    module_titre: 'Module 01',
    type_session: 'ponctuel',
    date_session: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    duree_minutes: 90,
    lien_zoom: 'https://zoom.us/j/example1',
    zoom_password: '123456',
    statut: 'programme',
  },
  {
    id: 'session-2',
    titre: 'Ancien Testament — Pentateuque',
    description: 'Étude approfondie des 5 premiers livres.',
    module_id: null,
    module_titre: 'Module 02',
    type_session: 'recurrent',
    date_session: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    duree_minutes: 60,
    lien_zoom: 'https://zoom.us/j/example2',
    zoom_password: null,
    statut: 'programme',
  },
  {
    id: 'session-3',
    titre: 'Q&A — Nouveau Testament',
    description: 'Session de questions-réponses sur le Nouveau Testament.',
    module_id: null,
    module_titre: 'Module 03',
    type_session: 'ponctuel',
    date_session: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    duree_minutes: 45,
    lien_zoom: 'https://zoom.us/j/example3',
    zoom_password: null,
    statut: 'termine',
  },
];

export async function getModulesFormation() {
  if (IS_MOCK) {
    return [
      { id: 'mock-1', numero: 1, titre: 'Introduction à la Bible', description: 'Canon, inspiration, interprétation biblique', duree_semaines: 8 },
      { id: 'mock-2', numero: 2, titre: 'Ancien Testament', description: 'Pentateuque, prophètes, écrits', duree_semaines: 8 },
      { id: 'mock-3', numero: 3, titre: 'Nouveau Testament', description: 'Évangiles, épîtres, Apocalypse', duree_semaines: 8 },
      { id: 'mock-4', numero: 4, titre: 'Théologie systématique', description: 'Doctrines fondamentales de la foi', duree_semaines: 8 },
      { id: 'mock-5', numero: 5, titre: "Histoire de l'Église", description: 'Des apôtres à nos jours', duree_semaines: 8 },
      { id: 'mock-6', numero: 6, titre: 'Vie chrétienne et ministère', description: 'Spiritualité, éthique, service', duree_semaines: 8 },
    ];
  }

  // MODE SUPABASE RÉEL — requête directe, aucun fallback mock
  const { data, error } = await supabase
    .from('modules_formation')
    .select('*')
    .order('numero', { ascending: true });

  if (error) {
    console.error('getModulesFormation error:', error);
    return [];
  }

  return data || [];
}

export async function updateModuleFormation(id, fields) {
  if (IS_MOCK) return { data: { id, ...fields }, error: null };
  const { data, error } = await supabase
    .from('modules_formation').update(fields).eq('id', id).select();
  if (error) console.error('updateModuleFormation error:', error);
  return { data: data?.[0] || fields, error };
}

export async function swapModuleOrdre(idA, numeroA, idB, numeroB) {
  if (IS_MOCK) return { error: null };
  const [r1, r2] = await Promise.all([
    supabase.from('modules_formation').update({ numero: numeroB }).eq('id', idA),
    supabase.from('modules_formation').update({ numero: numeroA }).eq('id', idB),
  ]);
  return { error: r1.error || r2.error || null };
}

export async function createModuleFormation(data) {
  if (IS_MOCK) return { data: { id: Date.now().toString(), ...data }, error: null };
  const { data: result, error } = await supabase
    .from('modules_formation')
    .insert({
      numero: data.numero,
      titre: data.titre,
      description: data.description || null,
      duree_semaines: data.duree_semaines || 8
    })
    .select()
    .single();
  if (error) console.error('createModuleFormation error:', error);
  return { data: result, error };
}

export async function deleteModuleFormation(moduleId) {
  if (IS_MOCK) return { error: null };
  const { error } = await supabase
    .from('modules_formation')
    .delete()
    .eq('id', moduleId);
  if (error) console.error('deleteModuleFormation error:', error);
  return { error: error ?? null };
}

export async function getSessionsLive(filters = {}) {
  if (IS_MOCK) return MOCK_SESSIONS_LIVE.map(s => ({ ...s, statut_calcule: getSessionStatut(s) }));
  let q = supabase.from('sessions_live')
    .select('*, module:modules_formation(numero, titre)')
    .order('date_session', { ascending: true });
  if (filters.statut) q = q.eq('statut', filters.statut);
  const { data, error } = await q;
  if (error) console.error(error);
  return (data || []).map(s => ({
    ...s,
    module_titre: s.module ? `Module ${String(s.module.numero).padStart(2,'0')}` : null,
    statut_calcule: getSessionStatut(s),
  }));
}

export async function createSessionLive(data) {
  if (IS_MOCK) { return { error: null, data: { id: 'new-mock-session' } }; }
  const payload = { ...data, module_id: data.module_id || null };
  const { data: session, error } = await supabase.from('sessions_live').insert([payload]).select('id').single();
  return { data: session, error };
}

export async function updateSessionLive(id, updates) {
  if (IS_MOCK) return { error: null };
  return supabase.from('sessions_live').update(updates).eq('id', id);
}

export async function deleteSessionLive(id) {
  if (IS_MOCK) return { error: null };
  return supabase.from('sessions_live').delete().eq('id', id);
}

export async function inviteParticipantsToSession(sessionId, eleveIds) {
  if (IS_MOCK) { return { error: null }; }
  const rows = eleveIds.map(eleveId => ({ session_id: sessionId, eleve_id: eleveId }));
  return supabase.from('sessions_participants').upsert(rows, { onConflict: 'session_id,eleve_id' });
}

export async function getMesSessionsLive(eleveId) {
  if (IS_MOCK) {
    return MOCK_SESSIONS_LIVE.map(s => ({ ...s, statut_calcule: getSessionStatut(s) }))
      .sort((a, b) => {
        const order = { en_cours: 0, programme: 1, termine: 2 };
        const oa = order[a.statut_calcule] ?? 3;
        const ob = order[b.statut_calcule] ?? 3;
        if (oa !== ob) return oa - ob;
        return new Date(a.date_session) - new Date(b.date_session);
      });
  }
  const { data, error } = await supabase
    .from('sessions_participants')
    .select('session:sessions_live(*, module:modules_formation(numero, titre))')
    .eq('eleve_id', eleveId)
    .order('session(date_session)', { ascending: true });
  if (error) console.error(error);
  return (data || [])
    .map(r => ({
      ...r.session,
      module_titre: r.session?.module ? `Module ${String(r.session.module.numero).padStart(2,'0')}` : null,
      statut_calcule: r.session ? getSessionStatut(r.session) : 'termine',
    }))
    .filter(Boolean)
    .sort((a, b) => {
      const order = { en_cours: 0, programme: 1, termine: 2 };
      const oa = order[a.statut_calcule] ?? 3;
      const ob = order[b.statut_calcule] ?? 3;
      if (oa !== ob) return oa - ob;
      return new Date(a.date_session) - new Date(b.date_session);
    });
}

export async function marquerSessionRejointe(sessionId, eleveId) {
  if (IS_MOCK) return { error: null };
  return supabase.from('sessions_participants').update({
    a_rejoint: true, date_rejoint: new Date().toISOString(),
  }).eq('session_id', sessionId).eq('eleve_id', eleveId);
}

export async function getParticipantsSession(sessionId) {
  if (IS_MOCK) return MOCK_ELEVES_STATS.map(e => ({ ...e, a_rejoint: false }));
  const { data, error } = await supabase
    .from('sessions_participants')
    .select('*, eleve:eleves(id, prenom, nom, email, statut)')
    .eq('session_id', sessionId);
  if (error) console.error(error);
  return (data || []).map(r => ({ ...r.eleve, a_rejoint: r.a_rejoint, invite_at: r.invite_at }));
}

// ─── Messages ─────────────────────────────────────────────────────

const MOCK_MESSAGES = [
  {
    id: 'msg-1',
    expediteur_type: 'admin',
    expediteur_id: 'admin',
    destinataire_id: 'eleve-1',
    sujet: 'Bienvenue',
    contenu: 'Bienvenue dans la Formation en Théologie Biblique ! Nous sommes ravis de vous avoir parmi nous. N\'hésitez pas à nous contacter si vous avez des questions.',
    lu: false,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'msg-2',
    expediteur_type: 'admin',
    expediteur_id: 'admin',
    destinataire_id: 'eleve-1',
    sujet: 'Premier cours',
    contenu: 'Votre premier cours en live est programmé dans 3 jours. Le lien Zoom vous sera envoyé 24h avant.',
    lu: false,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
];

const MOCK_CONVERSATIONS = [
  {
    partner_id: 'admin',
    partner_name: 'Administration E·T·C',
    last_message: 'Votre premier cours en live est programmé dans 3 jours.',
    last_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    unread_count: 2,
  },
];

// Convention : toutes les messages d'une conversation utilisent destinataire_id = eleve.id
// Admin → Elève : expediteur_type='admin', destinataire_id=eleve.id
// Élève → Admin : expediteur_type='eleve', destinataire_id=eleve.id, destinataire_type='admin'

export async function getConversations(eleveId) {
  if (IS_MOCK) return [{
    partner_id: 'admin',
    partner_name: 'Administration E·T·C',
    last_message: MOCK_MESSAGES[MOCK_MESSAGES.length - 1]?.contenu?.slice(0, 60) || null,
    last_at: MOCK_MESSAGES[MOCK_MESSAGES.length - 1]?.created_at || null,
    unread_count: MOCK_MESSAGES.filter(m => m.expediteur_type === 'admin' && !m.lu).length,
  }];
  const { data, error } = await supabase
    .from('messages').select('expediteur_type, contenu, created_at, lu')
    .eq('destinataire_id', eleveId)
    .order('created_at', { ascending: false });
  if (error) console.error(error);
  const msgs = data || [];
  const unread = msgs.filter(m => m.expediteur_type === 'admin' && !m.lu).length;
  const last = msgs[0];
  return [{
    partner_id: 'admin',
    partner_name: 'Administration E·T·C',
    last_message: last?.contenu?.slice(0, 60) || null,
    last_at: last?.created_at || null,
    unread_count: unread,
  }];
}

export async function getMessagesWithEleve(eleveId) {
  if (IS_MOCK) return MOCK_MESSAGES;
  const { data, error } = await supabase
    .from('messages').select('*')
    .eq('destinataire_id', eleveId)
    .order('created_at', { ascending: true });
  if (error) console.error(error);
  return data || [];
}

export async function envoyerMessageEleve(contenu) {
  if (IS_MOCK) {
    const msg = { id: `mock-eleve-${Date.now()}`, expediteur_type: 'eleve', contenu, created_at: new Date().toISOString(), lu: false };
    return { data: msg, error: null };
  }
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;
  if (!userId) return { data: null, error: { message: 'Non connecté' } };
  const { data: eleve } = await supabase.from('eleves').select('id').eq('auth_user_id', userId).single();
  if (!eleve) return { data: null, error: { message: 'Profil élève introuvable' } };
  const { data, error } = await supabase.from('messages').insert([{
    expediteur_id: userId,
    expediteur_type: 'eleve',
    destinataire_id: eleve.id,
    destinataire_type: 'admin',
    contenu,
    lu: false,
  }]).select().single();
  return { data, error };
}

export async function envoyerMessage(destinataireId, contenu, sujet = null) {
  if (IS_MOCK) { return { error: null }; }
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;
  return supabase.from('messages').insert([{
    expediteur_id: userId,
    expediteur_type: 'admin',
    destinataire_id: destinataireId,
    sujet,
    contenu,
    lu: false,
  }]);
}

export async function marquerMessagesLus(eleveId) {
  if (IS_MOCK) return { error: null };
  return supabase.from('messages')
    .update({ lu: true, date_lu: new Date().toISOString() })
    .eq('destinataire_id', eleveId).eq('lu', false);
}

export async function getMessagesNonLus(eleveId) {
  if (IS_MOCK) return MOCK_MESSAGES.filter(m => !m.lu && m.destinataire_id === 'eleve-1');
  const { data, error } = await supabase
    .from('messages').select('id, contenu, created_at')
    .eq('destinataire_id', eleveId).eq('lu', false)
    .order('created_at', { ascending: false });
  if (error) console.error(error);
  return data || [];
}

export async function broadcastMessage(contenu, filter = {}) {
  if (IS_MOCK) { return { error: null }; }
  let query = supabase.from('eleves').select('id').eq('statut', 'actif');
  if (filter.formule) query = query.eq('formule', filter.formule);
  const { data: eleves } = await query;
  if (!eleves?.length) return { error: null };
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;
  const rows = eleves.map(e => ({
    expediteur_id: userId,
    expediteur_type: 'admin',
    destinataire_id: e.id,
    contenu,
    lu: false,
  }));
  return supabase.from('messages').insert(rows);
}

export async function getConversationsAdmin() {
  return getAllElevesAvecDernierMessage();
}

// ── Tous les élèves actifs avec dernier message ──
export async function getAllElevesAvecDernierMessage() {
  if (IS_MOCK) return [
    { id: 'eleve-1', prenom: 'Marie', nom: 'Dupont', statut: 'actif', formule: 'integral', auth_user_id: 'user-1',
      last_message: 'Votre premier cours en live est programmé dans 3 jours.', last_at: new Date(Date.now() - 24*3600000).toISOString(), unread_count: 1 },
    { id: 'eleve-2', prenom: 'Jean', nom: 'Kabila', statut: 'actif', formule: 'echelonne', auth_user_id: 'user-2',
      last_message: "Bonjour, j'ai une question sur le Module 2.", last_at: new Date(Date.now() - 4*3600000).toISOString(), unread_count: 2 },
    { id: 'eleve-3', prenom: 'Élève', nom: 'Test', statut: 'actif', formule: 'integral', auth_user_id: 'user-3',
      last_message: null, last_at: null, unread_count: 0 },
  ];
  const { data: eleves } = await supabase
    .from('eleves').select('id, prenom, nom, auth_user_id, statut, formule').eq('statut', 'actif').order('nom');
  if (!eleves?.length) return [];
  const { data: msgs } = await supabase
    .from('messages').select('expediteur_id, expediteur_type, destinataire_id, contenu, created_at, lu')
    .order('created_at', { ascending: false });
  const eleveById = new Map(eleves.map(e => [e.id, e]));
  const eleveByAuthId = new Map(eleves.map(e => [e.auth_user_id, e]));
  const map = {};
  (msgs || []).forEach(m => {
    let eleveId = null;
    if (m.expediteur_type === 'admin' && eleveById.has(m.destinataire_id)) eleveId = m.destinataire_id;
    if (m.expediteur_type === 'eleve' && eleveByAuthId.has(m.expediteur_id)) eleveId = eleveByAuthId.get(m.expediteur_id).id;
    if (!eleveId) return;
    if (!map[eleveId]) map[eleveId] = { last_message: m.contenu?.slice(0, 60), last_at: m.created_at, unread_count: 0 };
    if (m.expediteur_type === 'eleve' && !m.lu) map[eleveId].unread_count++;
  });
  return eleves.map(e => ({ ...e, ...(map[e.id] || { last_message: null, last_at: null, unread_count: 0 }) }));
}

// ── Messages d'une conversation admin ↔ élève ──
export async function getMessagesConversation(eleveId) {
  if (IS_MOCK) {
    if (eleveId === 'eleve-1') return [
      { id: 'msg-1', expediteur_type: 'admin', contenu: 'Bienvenue dans la Formation en Théologie Biblique !', created_at: new Date(Date.now() - 2*24*3600000).toISOString(), lu: true, date_lu: new Date(Date.now() - 2*24*3600000 + 300000).toISOString() },
      { id: 'msg-2', expediteur_type: 'eleve', contenu: "Merci beaucoup, j'ai hâte de commencer !", created_at: new Date(Date.now() - 2*24*3600000 + 600000).toISOString(), lu: true },
      { id: 'msg-3', expediteur_type: 'admin', contenu: 'Votre premier cours en live est programmé dans 3 jours. Le lien Zoom vous sera envoyé 24h avant.', created_at: new Date(Date.now() - 24*3600000).toISOString(), lu: true, date_lu: new Date(Date.now() - 23*3600000).toISOString() },
      { id: 'msg-4', expediteur_type: 'eleve', contenu: 'Parfait, merci pour les informations !', created_at: new Date(Date.now() - 3600000).toISOString(), lu: false },
    ];
    if (eleveId === 'eleve-2') return [
      { id: 'msg-5', expediteur_type: 'eleve', contenu: "Bonjour, j'ai une question sur le Module 2.", created_at: new Date(Date.now() - 4*3600000).toISOString(), lu: false },
      { id: 'msg-6', expediteur_type: 'eleve', contenu: 'Est-ce que les ressources seront disponibles avant le cours ?', created_at: new Date(Date.now() - 3.9*3600000).toISOString(), lu: false },
    ];
    return [];
  }
  // Convention unifiée : toutes les messages utilisent destinataire_id = eleve.id
  const { data, error } = await supabase
    .from('messages').select('*')
    .eq('destinataire_id', eleveId)
    .order('created_at', { ascending: true });
  if (error) console.error(error);
  return data || [];
}

// ── Admin envoie un message à un élève ──
export async function envoyerMessageAdmin(destinataireId, contenu) {
  if (IS_MOCK) {
    const msg = { id: `msg-mock-${Date.now()}`, expediteur_type: 'admin', contenu, created_at: new Date().toISOString(), lu: false };
    return { data: msg, error: null };
  }
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;
  const { data, error } = await supabase.from('messages').insert([{
    expediteur_id: userId,
    expediteur_type: 'admin',
    destinataire_id: destinataireId,
    contenu,
    lu: false,
  }]).select().single();
  return { data, error };
}

// ── Admin marque les messages d'un élève comme lus ──
export async function marquerMessagesLusAdmin(eleveId) {
  if (IS_MOCK) return { error: null };
  const { data: eleve } = await supabase.from('eleves').select('auth_user_id').eq('id', eleveId).single();
  if (!eleve?.auth_user_id) return { error: null };
  return supabase.from('messages')
    .update({ lu: true, date_lu: new Date().toISOString() })
    .eq('expediteur_id', eleve.auth_user_id).eq('expediteur_type', 'eleve').eq('lu', false);
}

// ─── Ressources par module ────────────────────────────────────────

const MOCK_RESSOURCES = [
  { id: 'res-1', module_id: 'mod-1', module_numero: 1, titre: 'Syllabus — Module 1', description: 'Plan détaillé du module Introduction à la Bible', type_ressource: 'pdf', url: '#', taille_ko: 245, ordre: 1 },
  { id: 'res-2', module_id: 'mod-1', module_numero: 1, titre: 'Fiche mémo — Canon biblique', description: 'Résumé des 66 livres de la Bible', type_ressource: 'pdf', url: '#', taille_ko: 128, ordre: 2 },
  { id: 'res-3', module_id: 'mod-2', module_numero: 2, titre: 'Carte — Proche-Orient biblique', description: 'Carte géographique de l\'Ancien Testament', type_ressource: 'image', url: '#', taille_ko: 890, ordre: 1 },
];

export async function getRessourcesModule(moduleId) {
  if (IS_MOCK) return MOCK_RESSOURCES.filter(r => r.module_id === moduleId);
  const { data, error } = await supabase
    .from('ressources_module').select('*').eq('module_id', moduleId)
    .order('ordre', { ascending: true });
  if (error) console.error(error);
  return data || [];
}

export async function getAllRessourcesParModule() {
  if (IS_MOCK) {
    const grouped = {};
    MOCK_RESSOURCES.forEach(r => {
      if (!grouped[r.module_id]) grouped[r.module_id] = [];
      grouped[r.module_id].push(r);
    });
    return grouped;
  }
  const { data, error } = await supabase
    .from('ressources_module').select('*, module:modules_formation(numero, titre)').order('ordre');
  if (error) console.error(error);
  const grouped = {};
  (data || []).forEach(r => {
    const key = r.module_id;
    if (!grouped[key]) grouped[key] = { module: r.module, ressources: [] };
    grouped[key].ressources.push(r);
  });
  return grouped;
}

export async function createRessource(data) {
  if (IS_MOCK) {
    return { data: { id: `mock-${Date.now()}`, ...data, created_at: new Date().toISOString() }, error: null };
  }
  const { data: result, error } = await supabase
    .from('ressources_module')
    .insert([data])
    .select()
    .single();
  if (error) console.error('createRessource error:', error);
  return { data: result, error };
}

export async function updateRessource(id, updates) {
  if (IS_MOCK) return { error: null };
  return supabase.from('ressources_module').update(updates).eq('id', id);
}

export async function deleteRessource(id) {
  if (IS_MOCK) return { error: null };
  return supabase.from('ressources_module').delete().eq('id', id);
}

export async function uploadRessourceFile(file, moduleId, titre, description, ordre) {
  if (IS_MOCK) return { error: null };
  const ext = file.name.split('.').pop().toLowerCase();
  const typeMap = { pdf: 'pdf', mp4: 'video', mp3: 'audio', wav: 'audio', jpg: 'image', jpeg: 'image', png: 'image', gif: 'image' };
  const type_ressource = typeMap[ext] || 'lien';
  const path = `ressources/${moduleId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error: upErr } = await supabase.storage.from('etc-files').upload(path, file);
  if (upErr) return { error: upErr };
  const { data: urlData } = supabase.storage.from('etc-files').getPublicUrl(path);
  const taille_ko = Math.round(file.size / 1024);
  return createRessource({ module_id: moduleId, titre, description, type_ressource, url: urlData.publicUrl, taille_ko, ordre });
}

export async function getRessourcesEleve(eleveId) {
  if (IS_MOCK) {
    // Retourne uniquement les ressources des modules débloqués (mock: modules 1 et 2)
    return MOCK_RESSOURCES.filter(r => [1, 2].includes(r.module_numero));
  }
  const { data: progression } = await supabase
    .from('progression_eleve').select('module_id').eq('eleve_id', eleveId).eq('debloque', true);
  if (!progression?.length) return [];
  const moduleIds = progression.map(p => p.module_id);
  const { data, error } = await supabase
    .from('ressources_module').select('*, module:modules_formation(numero, titre)')
    .in('module_id', moduleIds).order('ordre');
  if (error) console.error(error);
  return data || [];
}
