import { supabase, getSessionStatut } from './client';
import { formatEuros, eurosVersCents, centsVersEuros } from './money';

// ─── Videos ───────────────────────────────────────────────────────────────

export async function addVideo(video) {
  return supabase.from('videos').insert([video]);
}

export async function deleteVideo(id) {
  return supabase.from('videos').delete().eq('id', id);
}

// ─── Messages priere ──────────────────────────────────────────────────────

export async function upsertMessagePriere(msg) {
  return supabase
    .from('messages_priere')
    .upsert([msg], { onConflict: 'famille,jour_semaine,semaine' });
}

export async function deleteMessagePriere(id) {
  return supabase.from('messages_priere').delete().eq('id', id);
}

// ─── Services ─────────────────────────────────────────────────────────────

export async function getAllServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('date_service', { ascending: false });
  if (error) console.error('[getAllServices]', error);
  return data || [];
}

export async function addService(service) {
  return supabase.from('services').insert([service]);
}

export async function updateService(id, updates) {
  return supabase.from('services').update(updates).eq('id', id);
}

export async function deleteService(id) {
  return supabase.from('services').delete().eq('id', id);
}

// ─── Cell groups ──────────────────────────────────────────────────────────

export async function getAllCellGroups() {
  const { data, error } = await supabase
    .from('cell_groups')
    .select('*')
    .order('jour_semaine');
  if (error) console.error('[getAllCellGroups]', error);
  return data || [];
}

export async function addCellGroup(group) {
  return supabase.from('cell_groups').insert([group]);
}

export async function updateCellGroup(id, updates) {
  return supabase.from('cell_groups').update(updates).eq('id', id);
}

export async function deleteCellGroup(id) {
  return supabase.from('cell_groups').delete().eq('id', id);
}

// ─── Announcements ────────────────────────────────────────────────────────

export async function getAllAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error('[getAllAnnouncements]', error);
  return data || [];
}

export async function addAnnouncement(ann) {
  return supabase.from('announcements').insert([ann]);
}

export async function updateAnnouncement(id, updates) {
  return supabase.from('announcements').update(updates).eq('id', id);
}

export async function deleteAnnouncement(id) {
  return supabase.from('announcements').delete().eq('id', id);
}

// ─── Site settings ────────────────────────────────────────────────────────

export async function updateSiteSetting(cle, valeur) {
  return supabase
    .from('site_settings')
    .upsert([{ cle, valeur, updated_at: new Date().toISOString() }], { onConflict: 'cle' });
}

export async function updateSiteSettings(settings) {
  const rows = Object.entries(settings).map(([cle, valeur]) => ({
    cle,
    valeur,
    updated_at: new Date().toISOString(),
  }));
  return supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'cle' });
}

// ─── Eleves ───────────────────────────────────────────────────────────────

export async function getAllElevesAvecStats() {
  const [elevesRes, confirmRes] = await Promise.all([
    supabase.from('eleves').select(`
      id, auth_user_id, prenom, nom, email, telephone, pays, ville,
      formule, formule_nom, formule_prix_total_cents, formule_nombre_echeances, formule_montant_echeance_cents,
      statut, progression_pct, date_inscription, derniere_connexion, notes_admin,
      paiements(montant_cents, statut, date_paiement),
      progression_eleve(complete)
    `).order('date_inscription', { ascending: false }),
    supabase.rpc('get_eleves_email_confirmed'),
  ]);
  if (elevesRes.error) console.error('[getAllElevesAvecStats]', elevesRes.error);

  const confirmMap = {};
  (confirmRes.data || []).forEach(r => { confirmMap[r.eleve_auth_id] = r.email_confirmed_at; });

  return (elevesRes.data || []).map(e => ({
    ...e,
    email_confirmed_at: confirmMap[e.auth_user_id] ?? null,
    total_paye_cents: (e.paiements || [])
      .filter(p => p.statut === 'reussi')
      .reduce((s, p) => s + Number(p.montant_cents), 0),
    modules_completes: (e.progression_eleve || []).filter(p => p.complete).length,
  }));
}

export async function suspendreEleve(eleveId, raison = '') {
  return supabase.from('eleves').update({ statut: 'suspendu', raison_suspension: raison }).eq('id', eleveId);
}

export async function reactiverEleve(eleveId) {
  return supabase.from('eleves').update({ statut: 'actif', raison_suspension: null }).eq('id', eleveId);
}

export async function updateNotesAdmin(eleveId, notes) {
  return supabase.from('eleves').update({ notes_admin: notes }).eq('id', eleveId);
}

// ─── Evaluations (admin) ──────────────────────────────────────────────────

export async function ajouterEvaluation(eleveId, data) {
  return supabase.from('evaluations').insert([{ ...data, eleve_id: eleveId }]);
}

export async function getEvaluationsAdmin(eleveId) {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*, module:modules_formation(titre)')
    .eq('eleve_id', eleveId)
    .order('date_eval', { ascending: false });
  if (error) console.error('[getEvaluationsAdmin]', error);
  return data || [];
}

// ─── Paiements (admin) ────────────────────────────────────────────────────

export async function getPaiementsAdmin(eleveId) {
  const { data, error } = await supabase
    .from('paiements')
    .select('*')
    .eq('eleve_id', eleveId)
    .order('date_paiement', { ascending: false });
  if (error) console.error('[getPaiementsAdmin]', error);
  return data || [];
}

export async function ajouterPaiement(eleveId, data) {
  return supabase.from('paiements').insert([{
    eleve_id: eleveId,
    montant_cents: data.montant_cents,
    devise: data.devise || 'EUR',
    type_paiement: data.type_paiement || 'mensualite',
    echeance_numero: data.echeance_numero || null,
    statut: 'reussi',
    methode: data.methode || null,
    reference: data.reference || null,
    date_paiement: data.date_paiement || new Date().toISOString(),
  }]);
}

// ─── Progression (admin) ──────────────────────────────────────────────────

export async function getProgressionAdmin(eleveId) {
  const { data, error } = await supabase
    .from('progression_eleve')
    .select('*, module:modules_formation(*)')
    .eq('eleve_id', eleveId)
    .order('module(numero)');
  if (error) console.error('[getProgressionAdmin]', error);
  return data || [];
}

export async function updateProgressionModule(eleveId, moduleId, action) {
  const updates = action === 'debloquer'
    ? { debloque: true, date_debloque: new Date().toISOString() }
    : { complete: true, date_complete: new Date().toISOString() };
  return supabase.from('progression_eleve').update(updates)
    .eq('eleve_id', eleveId).eq('module_id', moduleId);
}

// ─── Modules formation ────────────────────────────────────────────────────

export async function getModulesFormation() {
  const { data, error } = await supabase
    .from('modules_formation')
    .select('*')
    .order('numero');
  if (error) console.error('[getModulesFormation]', error);
  return data || [];
}

export async function createModuleFormation(data) {
  const { data: result, error } = await supabase
    .from('modules_formation')
    .insert({ numero: data.numero, titre: data.titre, description: data.description || null, duree_semaines: data.duree_semaines || 8 })
    .select()
    .single();
  if (error) console.error('[createModuleFormation]', error);
  return { data: result, error };
}

export async function updateModuleFormation(id, fields) {
  const { data, error } = await supabase
    .from('modules_formation').update(fields).eq('id', id).select();
  if (error) console.error('[updateModuleFormation]', error);
  return { data: data?.[0] || fields, error };
}

export async function swapModuleOrdre(idA, numeroA, idB, numeroB) {
  const [r1, r2] = await Promise.all([
    supabase.from('modules_formation').update({ numero: numeroB }).eq('id', idA),
    supabase.from('modules_formation').update({ numero: numeroA }).eq('id', idB),
  ]);
  return { error: r1.error || r2.error || null };
}

export async function deleteModuleFormation(moduleId) {
  const { error } = await supabase.from('modules_formation').delete().eq('id', moduleId);
  if (error) console.error('[deleteModuleFormation]', error);
  return { error: error ?? null };
}

// ─── Ressources module ────────────────────────────────────────────────────

export async function getAllRessourcesParModule() {
  const { data, error } = await supabase
    .from('ressources_module')
    .select('*, module:modules_formation(numero, titre)')
    .order('ordre');
  if (error) console.error('[getAllRessourcesParModule]', error);
  const grouped = {};
  (data || []).forEach(r => {
    const key = r.module_id;
    if (!grouped[key]) grouped[key] = { module: r.module, ressources: [] };
    grouped[key].ressources.push(r);
  });
  return grouped;
}

export async function createRessource(data) {
  const { data: result, error } = await supabase
    .from('ressources_module').insert([data]).select().single();
  if (error) console.error('[createRessource]', error);
  return { data: result, error };
}

export async function updateRessource(id, updates) {
  return supabase.from('ressources_module').update(updates).eq('id', id);
}

export async function deleteRessource(id) {
  return supabase.from('ressources_module').delete().eq('id', id);
}

export async function uploadRessourceFile(file, moduleId, titre, description, ordre) {
  const ext = file.name.split('.').pop().toLowerCase();
  const typeMap = { pdf: 'pdf', mp4: 'video', mp3: 'audio', wav: 'audio', jpg: 'image', jpeg: 'image', png: 'image', gif: 'image' };
  const type_ressource = typeMap[ext] || 'lien';

  const path = `${moduleId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error: upErr } = await supabase.storage.from('ressources').upload(path, file);
  if (upErr) return { error: upErr };

  const taille_ko = Math.round(file.size / 1024);
  return createRessource({
    module_id: moduleId,
    titre,
    description,
    type_ressource,
    storage_path: path,
    url: null,
    taille_ko,
    ordre,
  });
}

// ─── Formules paiement (admin) ────────────────────────────────────────────

export async function getFormulesPaiementAdmin(includeInactive = false) {
  let query = supabase.from('formules_paiement').select('*').order('ordre_affichage');
  if (!includeInactive) {
    query = query.eq('actif', true);
  }
  const { data, error } = await query;
  if (error) console.error('[getFormulesPaiementAdmin]', error);
  return data || [];
}

export async function createFormulePaiement(formule) {
  const { data, error } = await supabase
    .from('formules_paiement').insert([formule]).select().single();
  if (error) console.error('[createFormulePaiement]', error);
  return { data, error };
}

export async function updateFormulePaiement(id, updates) {
  const { data, error } = await supabase
    .from('formules_paiement').update(updates).eq('id', id).select().single();
  if (error) console.error('[updateFormulePaiement]', error);
  return { data, error };
}

export async function deleteFormulePaiement(id) {
  const { error } = await supabase.from('formules_paiement').delete().eq('id', id);
  if (error) console.error('[deleteFormulePaiement]', error);
  return { error };
}

// ─── Sessions live (admin) ────────────────────────────────────────────────

export async function getSessionsLive(filters = {}) {
  let q = supabase.from('sessions_live')
    .select('*, module:modules_formation(numero, titre)')
    .order('date_session', { ascending: true });
  if (filters.statut) q = q.eq('statut', filters.statut);
  const { data, error } = await q;
  if (error) console.error('[getSessionsLive]', error);
  return (data || []).map(s => ({
    ...s,
    module_titre: s.module ? `Module ${String(s.module.numero).padStart(2, '0')}` : null,
    statut_calcule: getSessionStatut(s),
  }));
}

export async function createSessionLive(data) {
  const payload = { ...data, module_id: data.module_id || null };
  const { data: session, error } = await supabase.from('sessions_live').insert([payload]).select('id').single();
  return { data: session, error };
}

export async function updateSessionLive(id, updates) {
  return supabase.from('sessions_live').update(updates).eq('id', id);
}

export async function deleteSessionLive(id) {
  return supabase.from('sessions_live').delete().eq('id', id);
}

export async function inviteParticipantsToSession(sessionId, eleveIds) {
  const rows = eleveIds.map(eleveId => ({ session_id: sessionId, eleve_id: eleveId }));
  return supabase.from('sessions_participants').upsert(rows, { onConflict: 'session_id,eleve_id' });
}

export async function getParticipantsSession(sessionId) {
  const { data, error } = await supabase
    .from('sessions_participants')
    .select('*, eleve:eleves(id, prenom, nom, email, statut)')
    .eq('session_id', sessionId);
  if (error) console.error('[getParticipantsSession]', error);
  return (data || []).map(r => ({ ...r.eleve, a_rejoint: r.a_rejoint, invite_at: r.invite_at }));
}

// ─── Messages (admin) ─────────────────────────────────────────────────────

export async function getAllElevesAvecDernierMessage() {
  const { data: eleves } = await supabase
    .from('eleves').select('id, prenom, nom, auth_user_id, statut, formule')
    .eq('statut', 'actif').order('nom');

  if (!eleves?.length) return [];

  const { data: msgs } = await supabase
    .from('messages').select('eleve_id, sender_role, contenu, created_at, lu')
    .order('created_at', { ascending: false });

  const map = {};
  (msgs || []).forEach(m => {
    const eleveId = m.eleve_id;
    if (!map[eleveId]) map[eleveId] = { last_message: m.contenu?.slice(0, 60), last_at: m.created_at, unread_count: 0 };
    if (m.sender_role === 'eleve' && !m.lu) map[eleveId].unread_count++;
  });

  return eleves.map(e => ({ ...e, ...(map[e.id] || { last_message: null, last_at: null, unread_count: 0 }) }));
}

export async function getMessagesConversation(eleveId) {
  const { data, error } = await supabase
    .from('messages').select('*')
    .eq('eleve_id', eleveId)
    .order('created_at', { ascending: true });
  if (error) console.error('[getMessagesConversation]', error);
  return data || [];
}

export async function envoyerMessageAdmin(eleveId, contenu) {
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;
  const { data, error } = await supabase.from('messages').insert([{
    eleve_id: eleveId,
    sender_role: 'admin',
    sender_auth_id: userId,
    contenu,
    lu: false,
  }]).select().single();
  return { data, error };
}

export async function marquerMessagesLusAdmin(eleveId) {
  return supabase.from('messages')
    .update({ lu: true, date_lu: new Date().toISOString() })
    .eq('eleve_id', eleveId)
    .eq('sender_role', 'eleve')
    .eq('lu', false);
}

export async function broadcastMessage(contenu, filter = {}) {
  let query = supabase.from('eleves').select('id').eq('statut', 'actif');
  if (filter.formule) query = query.eq('formule', filter.formule);
  const { data: eleves } = await query;
  if (!eleves?.length) return { error: null };

  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;

  const rows = eleves.map(e => ({
    eleve_id: e.id,
    sender_role: 'admin',
    sender_auth_id: userId,
    contenu,
    lu: false,
  }));
  return supabase.from('messages').insert(rows);
}

// ─── Donations (lecture seule) ────────────────────────────────────────────

export async function getDonations() {
  const { data, error } = await supabase
    .from('donations')
    .select('id, nom_donateur, email, montant_cents, devise, statut, message, date_don')
    .order('date_don', { ascending: false });
  if (error) console.error('[getDonations]', error);
  return data || [];
}

// ─── Statistiques ─────────────────────────────────────────────────────────

export async function getStatistiquesFormation() {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalInscrits },
    { count: inscritsCeMois },
    { count: elevesActifs },
    { data: paiementsData },
  ] = await Promise.all([
    supabase.from('eleves').select('*', { count: 'exact', head: true }),
    supabase.from('eleves').select('*', { count: 'exact', head: true }).gte('date_inscription', thisMonth),
    supabase.from('eleves').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
    supabase.from('paiements').select('montant_cents, statut'),
  ]);

  const revenuTotalCents = (paiementsData || [])
    .filter(p => p.statut === 'reussi')
    .reduce((s, p) => s + Number(p.montant_cents), 0);
  const paiementsReussis = (paiementsData || []).filter(p => p.statut === 'reussi').length;
  const tauxPaiement = totalInscrits ? Math.round((paiementsReussis / totalInscrits) * 100) : 0;

  return {
    totalInscrits: totalInscrits || 0,
    inscritsCeMois: inscritsCeMois || 0,
    elevesActifs: elevesActifs || 0,
    revenuTotalCents,
    tauxPaiement,
  };
}

export async function getElevesParPays() {
  const { data, error } = await supabase
    .from('eleves').select('pays').not('pays', 'is', null);
  if (error) console.error('[getElevesParPays]', error);
  const counts = {};
  (data || []).forEach(e => { counts[e.pays] = (counts[e.pays] || 0) + 1; });
  return Object.entries(counts).map(([pays, count]) => ({ pays, count }))
    .sort((a, b) => b.count - a.count);
}

export async function exportElevesCSV() {
  const { data } = await supabase.from('eleves')
    .select('prenom, nom, email, pays, ville, formule, statut, progression_pct, date_inscription')
    .order('date_inscription', { ascending: false });
  if (!data) return;
  const headers = 'Prenom,Nom,Email,Pays,Ville,Formule,Statut,Progression,Date inscription';
  const rows = data.map(e =>
    `${e.prenom || ''},${e.nom},${e.email},${e.pays || ''},${e.ville || ''},${e.formule},${e.statut},${e.progression_pct}%,${e.date_inscription?.split('T')[0] || ''}`
  );
  downloadCSV([headers, ...rows].join('\n'), 'eleves-formation.csv');
}

function downloadCSV(csv, filename) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Re-export money utils for admin convenience
export { formatEuros, eurosVersCents, centsVersEuros };
